from fastapi import APIRouter, Query, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from typing import Optional
import logging
import re
import uuid
from pydantic import BaseModel

from app.agents.chat_agent import create_chat_stream, ChatStreamMessage
from app.utils.sse import format_sse_event
from app.core.session_manager import session_manager
from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient

router = APIRouter()
logger = logging.getLogger(__name__)

# Session ID validation pattern (UUID format)
SESSION_ID_PATTERN = re.compile(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$')


class InterruptRequest(BaseModel):
    """Request body for interrupt endpoint"""
    session_id: str


@router.post("/chat/interrupt")
async def interrupt_chat(body: InterruptRequest):
    """
    Interrupt an active chat stream

    Request body:
        - session_id: UUID of the conversation session

    Returns:
        - success: true if interrupted
        - error: if session not found or interrupt failed
    """
    session_id = body.session_id
    logger.info(f"Interrupt request for session: {session_id}")

    try:
        # Interrupt the session via SessionManager
        await session_manager.interrupt_session(session_id)
        logger.info(f"Successfully interrupted session: {session_id}")

        return {"success": True}

    except KeyError:
        raise HTTPException(
            status_code=404,
            detail="Session not found or already completed"
        )
    except Exception as e:
        logger.error(f"Failed to interrupt {session_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to interrupt: {str(e)}"
        )


@router.websocket("/chat/ws")
async def chat_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for persistent chat conversations using join room pattern.

    Pattern:
        1. Client connects to /chat/ws
        2. Client sends join message with room_id (chat session UUID) and optional sdk_session_id
        3. Server creates/resumes ClaudeSDKClient:
           - If sdk_session_id provided: resume Claude conversation
           - Otherwise: create new Claude conversation
        4. Client can send multiple messages over same connection
        5. After first message, server sends sdk_session_id to client for persistence
        6. On disconnect, ClaudeSDKClient stays alive for reconnection

    Client → Server Messages:
        {
            "type": "join",
            "room_id": "uuid",  // Chat session ID (our UUID)
            "sdk_session_id": "string"  // Optional: Claude SDK session ID for resume
        }
        {
            "type": "message",
            "content": "User message text"
        }
        {
            "type": "leave"  // Optional: explicitly leave session
        }

    Server → Client Messages:
        {
            "type": "joined",
            "room_id": "uuid"
        }
        {
            "type": "sdk_session_id",
            "sdk_session_id": "string"  // Sent after first message
        }
        {
            "type": "message",
            "role": "assistant",
            "content": "Partial text chunk"
        }
        {
            "type": "done"
        }
        {
            "type": "error",
            "error": "Error message"
        }
    """
    logger.info("🔌 WebSocket connection attempt - accepting...")
    await websocket.accept()
    logger.info("✅ WebSocket ACCEPTED - waiting for messages")

    current_room_id: Optional[str] = None
    client: Optional[ClaudeSDKClient] = None

    try:
        while True:
            # Receive message from client
            logger.info("⏳ Waiting to receive message from client...")
            data = await websocket.receive_json()
            logger.info(f"📨 Received data: {data}")
            message_type = data.get('type')

            if message_type == 'join':
                # Join a chat room
                room_id = data.get('room_id')
                sdk_session_id = data.get('sdk_session_id')

                # Validate room_id format
                if not room_id or not SESSION_ID_PATTERN.match(room_id):
                    await websocket.send_json({
                        'type': 'error',
                        'error': 'Invalid room_id format. Must be a valid UUID.'
                    })
                    continue

                logger.info(f"Join request - room_id: {room_id}, sdk_session_id: {sdk_session_id or 'none'}")

                try:
                    # Check if client exists in memory (WebSocket reconnection)
                    existing_client = await session_manager.get_client(room_id)

                    if existing_client:
                        # Client still in memory - reconnection during same server session
                        client = existing_client
                        logger.info(f"Rejoined existing in-memory client for room: {room_id}")
                    else:
                        # Client not in memory - create new ClaudeSDKClient
                        if sdk_session_id:
                            # Try to resume existing Claude conversation
                            logger.info(f"Attempting to resume with sdk_session_id: {sdk_session_id}")
                            try:
                                options = ClaudeAgentOptions(
                                    resume=sdk_session_id,
                                    permission_mode='bypassPermissions',
                                    include_partial_messages=True,
                                )
                                client, was_created = await session_manager.get_or_create_client(room_id, options)
                                logger.info(f"✅ Successfully resumed session for room: {room_id}")
                            except Exception as resume_error:
                                # Resume failed - fall back to new session
                                logger.warning(f"⚠️  Resume failed, creating new session: {resume_error}")
                                options = ClaudeAgentOptions(
                                    permission_mode='bypassPermissions',
                                    include_partial_messages=True,
                                )
                                client, was_created = await session_manager.get_or_create_client(room_id, options)
                                logger.info(f"✅ Created new session (resume fallback) for room: {room_id}")
                        else:
                            # New Claude conversation
                            options = ClaudeAgentOptions(
                                permission_mode='bypassPermissions',
                                include_partial_messages=True,
                            )
                            logger.info(f"Creating new client for room: {room_id}")
                            client, was_created = await session_manager.get_or_create_client(room_id, options)
                            logger.info(f"✅ Created new client for room: {room_id}")

                    current_room_id = room_id

                    # Confirm successful join
                    await websocket.send_json({
                        'type': 'joined',
                        'room_id': room_id
                    })
                    logger.info(f"✅ Successfully joined and confirmed room: {room_id}")

                except Exception as e:
                    logger.error(f"❌ Failed to join room {room_id}: {type(e).__name__}: {e}")
                    await websocket.send_json({
                        'type': 'error',
                        'error': f'Failed to join room: {str(e)}'
                    })
                    continue

            elif message_type == 'message':
                # Send a chat message
                if not client or not current_room_id:
                    await websocket.send_json({
                        'type': 'error',
                        'error': 'Not joined to any room. Send join message first.'
                    })
                    continue

                user_message = data.get('content', '')
                logger.info(f"Received message on room {current_room_id}: {user_message[:50]}")

                try:
                    # Send to SAME Claude client (maintains conversation context)
                    await client.query(user_message)

                    # Stream response back to client and extract SDK session ID
                    sdk_session_id_to_send = None
                    async for msg in client.receive_response():
                        wrapped_msg = ChatStreamMessage(msg)

                        # Extract SDK session ID if present (sent after first message)
                        if not sdk_session_id_to_send:
                            sdk_session_id_to_send = wrapped_msg.get_session_id()

                        # Send text deltas
                        text_delta = wrapped_msg.get_text_delta()
                        if text_delta:
                            await websocket.send_json({
                                'type': 'message',
                                'role': 'assistant',
                                'content': text_delta
                            })

                    # Send SDK session ID if we got one (for frontend to persist)
                    if sdk_session_id_to_send:
                        await websocket.send_json({
                            'type': 'sdk_session_id',
                            'sdk_session_id': sdk_session_id_to_send
                        })
                        logger.info(f"Sent SDK session ID: {sdk_session_id_to_send}")

                    # Send completion event
                    await websocket.send_json({'type': 'done'})
                    logger.info(f"Completed response for room: {current_room_id}")

                except Exception as e:
                    logger.error(f"Error processing message for room {current_room_id}: {e}", exc_info=True)
                    await websocket.send_json({
                        'type': 'error',
                        'error': str(e)
                    })

            elif message_type == 'leave':
                # Client explicitly leaving room (optional)
                logger.info(f"Client leaving room: {current_room_id}")
                current_room_id = None
                client = None

            else:
                logger.warning(f"Unknown message type: {message_type}")

    except WebSocketDisconnect as e:
        logger.warning(f"❌ WebSocket DISCONNECTED - room: {current_room_id}, reason: {e}")
        # NOTE: Don't destroy ClaudeSDKClient - it stays alive for reconnection!
    except Exception as e:
        logger.error(f"💥 WebSocket EXCEPTION - room {current_room_id}: {type(e).__name__}: {e}", exc_info=True)


@router.get("/chat/stream")
async def chat_stream(
    message: str = Query(..., description="User message", min_length=1, max_length=10000),
    session_id: Optional[str] = Query(None, description="Session ID for continuous conversation"),
    # Uncomment when ready to add auth:
    # user: dict = RequireAuth
):
    """
    Stream chat responses via Server-Sent Events (SSE)

    Query Parameters:
        - message: User message to send (max 10,000 characters)
        - session_id: Optional UUID - if provided, continues conversation;
                     if omitted, server generates new UUID for new conversation

    Returns:
        SSE stream with events:
        - 'message': Partial text chunks as they arrive
        - 'done': Final event with sdkSessionId for client to persist
        - 'error': Error message if something goes wrong

    Pattern:
        1. Client sends message without session_id -> gets new session_id in 'done' event
        2. Client stores session_id from 'done' event
        3. Client sends follow-up with same session_id -> SAME client, full context
        4. Repeat step 3 for continuous conversation
    """
    # Generate new session_id if not provided (new conversation)
    generated_new_session = False
    if not session_id:
        session_id = str(uuid.uuid4())
        generated_new_session = True
        logger.info(f"Generated new session_id: {session_id}")
    elif not SESSION_ID_PATTERN.match(session_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid session_id format. Must be a valid UUID."
        )
    else:
        logger.info(f"Resuming session_id: {session_id}")

    async def event_generator():
        """Generate SSE events from chat stream"""
        logger.info(f"Event generator started - session_id: {session_id}, message: {message[:50]}")

        try:
            # Create chat stream
            # We're resuming if session_id was provided by client (not generated)
            is_resuming = not generated_new_session
            logger.info(f"Creating chat stream... (resuming={is_resuming})")
            stream = create_chat_stream(message, session_id, is_resuming=is_resuming)

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

            logger.info(f"Processed {msg_count} messages from stream")

            # Send completion event with session ID
            # Client should store this session_id for future messages
            logger.info(f"Sending done event - sdkSessionId: {session_id}")
            yield format_sse_event('done', {
                'sdkSessionId': session_id
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
