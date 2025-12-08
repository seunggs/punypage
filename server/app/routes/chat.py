from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import logging
import re

from app.agents.chat_agent import create_chat_stream
from app.utils.sse import format_sse_event

router = APIRouter()
logger = logging.getLogger(__name__)

# Session ID validation pattern (UUID format)
SESSION_ID_PATTERN = re.compile(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$')


@router.get("/chat/stream")
async def chat_stream(
    message: str = Query(..., description="User message", min_length=1, max_length=10000),
    session_id: Optional[str] = Query(None, description="Session ID to resume conversation"),
    # Uncomment when ready to add auth:
    # user: dict = RequireAuth
):
    """
    Stream chat responses via Server-Sent Events (SSE)

    Query Parameters:
        - message: User message to send (max 10,000 characters)
        - session_id: Optional UUID session ID to resume previous conversation

    Returns:
        SSE stream with events:
        - 'message': Partial text chunks as they arrive
        - 'done': Final event with session_id for client to persist
        - 'error': Error message if something goes wrong
    """
    # Validate session_id format if provided
    if session_id and not SESSION_ID_PATTERN.match(session_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid session_id format. Must be a valid UUID."
        )

    async def event_generator():
        """Generate SSE events from chat stream"""
        final_session_id = None
        logger.info(f"Event generator started - message: {message[:50]}, session_id: {session_id}")

        try:
            # Create chat stream
            logger.info("Creating chat stream...")
            stream = create_chat_stream(message, session_id)

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

                # Capture session ID from result
                session = msg.get_session_id()
                if session:
                    logger.info(f"Captured session ID: {session}")
                    final_session_id = session

            logger.info(f"Processed {msg_count} messages from stream")

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
