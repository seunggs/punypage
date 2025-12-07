from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AssistantMessage, TextBlock
from typing import AsyncIterator, Optional
import logging

logger = logging.getLogger(__name__)


class ChatStreamMessage:
    """Wrapper for messages from ClaudeSDKClient"""
    def __init__(self, msg):
        self.raw = msg
        logger.debug(f"ChatStreamMessage created - type: {type(msg).__name__}, msg: {msg}")

    def get_text_delta(self) -> Optional[str]:
        """Extract text delta from StreamEvent or AssistantMessage"""
        # Check if this is a StreamEvent with content_block_delta
        if hasattr(self.raw, 'event') and isinstance(self.raw.event, dict):
            event_type = self.raw.event.get('type')
            if event_type == 'content_block_delta':
                delta = self.raw.event.get('delta', {})
                if delta.get('type') == 'text_delta':
                    text = delta.get('text', '')
                    logger.debug(f"Extracted text delta from StreamEvent: '{text}'")
                    return text

        # Fallback: Check if this is an AssistantMessage with TextBlock content
        if isinstance(self.raw, AssistantMessage):
            for block in self.raw.content:
                if isinstance(block, TextBlock):
                    text = block.text
                    logger.debug(f"Extracted text from AssistantMessage: {text[:100]}...")
                    return text

        logger.debug(f"No text extracted from message type: {type(self.raw).__name__}")
        return None

    def get_session_id(self) -> Optional[str]:
        """Extract session_id from result messages"""
        # Check for session_id attribute
        session_id = getattr(self.raw, 'session_id', None)
        if session_id:
            logger.info(f"Found session_id: {session_id}")
        return session_id


async def create_chat_stream(
    message: str,
    session_id: Optional[str] = None
) -> AsyncIterator[ChatStreamMessage]:
    """
    Create streaming chat using ClaudeSDKClient (per-request pattern)

    Args:
        message: User message to send
        session_id: Optional session ID to resume conversation

    Yields:
        ChatStreamMessage: Wrapped SDK messages
    """
    # Configure client options
    options = ClaudeAgentOptions(
        permission_mode='bypassPermissions',
        include_partial_messages=True,  # Enable real-time streaming
    )

    try:
        logger.info(f"Starting chat stream - session_id: {session_id or 'new'}, message: {message[:100]}")

        # Use async context manager for proper lifecycle
        async with ClaudeSDKClient(options=options) as client:
            logger.info("ClaudeSDKClient context manager entered")

            # Send query - automatically creates or resumes session
            logger.info(f"Sending query to Claude - session_id: {session_id}")
            await client.query(message, session_id=session_id)
            logger.info("Query sent successfully, waiting for responses...")

            # Stream messages as they arrive
            message_count = 0
            async for msg in client.receive_response():
                message_count += 1
                logger.info(f"Received message #{message_count} - type: {type(msg).__name__}")
                yield ChatStreamMessage(msg)

            logger.info(f"Finished receiving messages - total: {message_count}")

    except Exception as e:
        logger.error(f"Chat stream error: {e}", exc_info=True)
        raise
    finally:
        logger.info("Chat stream completed")
