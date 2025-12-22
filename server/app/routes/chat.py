from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import logging
import re
import uuid
import asyncio
from pydantic import BaseModel

from app.agents.chat_agent import create_chat_stream
from app.utils.sse import format_sse_event
from app.core.active_clients import active_clients

router = APIRouter()
logger = logging.getLogger(__name__)

# Session ID validation pattern (UUID format)
SESSION_ID_PATTERN = re.compile(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$')


class InterruptRequest(BaseModel):
    """Request body for interrupt endpoint"""
    request_id: str


@router.post("/chat/interrupt")
async def interrupt_chat(body: InterruptRequest):
    """
    Interrupt an active chat stream

    Request body:
        - request_id: UUID of the active chat request

    Returns:
        - success: true if interrupted
        - error: if request not found or interrupt failed
    """
    request_id = body.request_id
    logger.info(f"Interrupt request for: {request_id}")

    # Get active client
    client = await active_clients.get_client(request_id)

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Chat request not found or already completed"
        )

    try:
        # Call SDK interrupt
        await client.interrupt()
        logger.info(f"Successfully interrupted: {request_id}")

        # Clean up
        await active_clients.remove_client(request_id)

        return {"success": True}

    except Exception as e:
        logger.error(f"Failed to interrupt {request_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to interrupt: {str(e)}"
        )


@router.get("/chat/stream")
async def chat_stream(
    message: str = Query(..., description="User message", min_length=1, max_length=10000),
    session_id: Optional[str] = Query(None, description="Session ID to resume conversation"),
    user_id: Optional[str] = Query(None, description="User ID for document operations (temporary - will use auth)"),
    # Uncomment when ready to add auth:
    # user: dict = RequireAuth
):
    """
    Stream chat responses via Server-Sent Events (SSE)

    Query Parameters:
        - message: User message to send (max 10,000 characters)
        - session_id: Optional UUID session ID to resume previous conversation
        - user_id: Optional user ID for document operations (temporary)

    Returns:
        SSE stream with events:
        - 'requestId': Request ID for interrupt capability
        - 'message': Partial text chunks as they arrive
        - 'tool_use': Tool invocation events (for document operations)
        - 'tool_result': Tool execution results (document created/updated/etc)
        - 'done': Final event with session_id for client to persist
        - 'error': Error message if something goes wrong
    """
    # Validate session_id format if provided
    if session_id and not SESSION_ID_PATTERN.match(session_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid session_id format. Must be a valid UUID."
        )

    # Generate unique request ID for this chat request
    request_id = str(uuid.uuid4())

    async def event_generator():
        """Generate SSE events from chat stream"""
        final_session_id = None
        logger.info(f"Event generator started - request_id: {request_id}, message: {message[:50]}, session_id: {session_id}")

        # Queue for cache invalidation events from PostToolUse hook
        cache_invalidate_queue = asyncio.Queue()

        async def on_cache_invalidate(tool_name: str, tool_response: dict):
            """Callback from PostToolUse hook to emit cache invalidation events"""
            logger.info(f"[CACHE INVALIDATE CALLBACK] ✓ Called with tool: {tool_name}, response: {tool_response}")
            logger.info(f"[CACHE INVALIDATE CALLBACK] ✓ Queueing event...")
            await cache_invalidate_queue.put({
                'tool_name': tool_name,
                'tool_response': tool_response
            })
            logger.info(f"[CACHE INVALIDATE CALLBACK] ✓ Event queued successfully. Queue size: {cache_invalidate_queue.qsize()}")

        try:
            # Send request ID immediately for interrupt capability
            yield format_sse_event('requestId', {
                'requestId': request_id
            })

            # Create chat stream with request_id, user_id, and cache invalidation callback
            logger.info("Creating chat stream...")
            stream = create_chat_stream(message, session_id, request_id, user_id, on_cache_invalidate)

            # Process messages from agent
            msg_count = 0
            async for msg in stream:
                msg_count += 1
                logger.info(f"Processing message #{msg_count} in event_generator")

                # Handle text deltas (streaming chunks)
                text_delta = msg.get_text_delta()
                if text_delta:
                    logger.info(f"Sending text delta via SSE - length: {len(text_delta)}")
                    yield format_sse_event('message', {
                        'role': 'assistant',
                        'content': text_delta
                    })
                else:
                    logger.debug(f"Message #{msg_count} had no text delta")

                # Handle tool use events (document operations)
                tool_use = msg.get_tool_use()
                if tool_use:
                    logger.info(f"Sending tool_use via SSE - tool: {tool_use['tool_name']}")
                    yield format_sse_event('tool_use', tool_use)

                # Handle tool result events (document created/updated/etc)
                tool_result = msg.get_tool_result()
                if tool_result:
                    logger.info(f"Sending tool_result via SSE - tool_use_id: {tool_result['tool_use_id']}")
                    yield format_sse_event('tool_result', tool_result)

                # Capture session ID from result
                session = msg.get_session_id()
                if session:
                    logger.info(f"Captured session ID: {session}")
                    final_session_id = session

                # Check for cache invalidation events from PostToolUse hook
                logger.debug(f"[SSE STREAM] Checking cache invalidation queue (size: {cache_invalidate_queue.qsize()})")
                while not cache_invalidate_queue.empty():
                    try:
                        cache_event = cache_invalidate_queue.get_nowait()
                        logger.info(f"[SSE STREAM] ✓ Dequeued cache event: {cache_event}")
                        logger.info(f"[SSE STREAM] ✓ Sending cache_invalidate SSE event for: {cache_event['tool_name']}")
                        yield format_sse_event('cache_invalidate', cache_event)
                        logger.info(f"[SSE STREAM] ✓ cache_invalidate SSE event sent successfully")
                    except asyncio.QueueEmpty:
                        logger.debug(f"[SSE STREAM] Queue empty (race condition)")
                        break

            logger.info(f"Processed {msg_count} messages from stream")

            # Drain any remaining cache invalidation events
            logger.info(f"[SSE STREAM] Draining final cache invalidation events (queue size: {cache_invalidate_queue.qsize()})")
            while not cache_invalidate_queue.empty():
                try:
                    cache_event = cache_invalidate_queue.get_nowait()
                    logger.info(f"[SSE STREAM] ✓ Dequeued final cache event: {cache_event}")
                    logger.info(f"[SSE STREAM] ✓ Sending final cache_invalidate SSE event for: {cache_event['tool_name']}")
                    yield format_sse_event('cache_invalidate', cache_event)
                    logger.info(f"[SSE STREAM] ✓ Final cache_invalidate SSE event sent successfully")
                except asyncio.QueueEmpty:
                    break

            # Send completion event with session ID
            logger.info(f"Sending done event - sessionId: {final_session_id}")
            yield format_sse_event('done', {
                'sessionId': final_session_id
            })

        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            yield format_sse_event('error', {
                'error': str(e)
            })

    # Return SSE streaming response
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering if behind proxy
        }
    )
