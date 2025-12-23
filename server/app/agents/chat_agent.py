from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AssistantMessage, TextBlock
from typing import AsyncIterator, Optional
import logging

from app.core.session_manager import session_manager

logger = logging.getLogger(__name__)


class ChatStreamMessage:
    """Wrapper for messages from ClaudeSDKClient"""
    def __init__(self, msg):
        self.raw = msg
        logger.debug(f"ChatStreamMessage created - type: {type(msg).__name__}, msg: {msg}")

    def get_text_delta(self) -> Optional[str]:
        """Extract text delta from StreamEvent only (for WebSocket streaming)"""
        # Only extract from StreamEvent with content_block_delta
        # With include_partial_messages=True, we get deltas during streaming
        # We should NOT extract from final AssistantMessage to avoid duplication
        if hasattr(self.raw, 'event') and isinstance(self.raw.event, dict):
            event_type = self.raw.event.get('type')
            if event_type == 'content_block_delta':
                delta = self.raw.event.get('delta', {})
                if delta.get('type') == 'text_delta':
                    text = delta.get('text', '')
                    logger.debug(f"Extracted text delta from StreamEvent: '{text}'")
                    return text

        logger.debug(f"No text delta extracted from message type: {type(self.raw).__name__}")
        return None

    def get_tool_use(self) -> Optional[dict]:
        """Extract tool use from StreamEvent"""
        if hasattr(self.raw, 'event') and isinstance(self.raw.event, dict):
            event_type = self.raw.event.get('type')
            if event_type == 'content_block_start':
                content_block = self.raw.event.get('content_block', {})
                if content_block.get('type') == 'tool_use':
                    tool_data = {
                        'tool_use_id': content_block.get('id'),
                        'tool_name': content_block.get('name'),
                        'input': content_block.get('input', {})
                    }
                    logger.debug(f"Extracted tool_use: {tool_data['tool_name']} (id: {tool_data['tool_use_id']})")
                    return tool_data
        return None

    def get_tool_result(self) -> Optional[dict]:
        """Extract tool result from ToolResultMessage"""
        # Check if this is a ToolResultMessage
        if type(self.raw).__name__ == 'ToolResultMessage':
            result_data = {
                'tool_use_id': getattr(self.raw, 'tool_use_id', None),
                'content': getattr(self.raw, 'content', None),
                'is_error': getattr(self.raw, 'is_error', False)
            }
            logger.debug(f"Extracted tool_result for tool_use_id: {result_data['tool_use_id']}, is_error: {result_data['is_error']}")
            return result_data
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
    session_id: str,
    is_resuming: bool = False,
) -> AsyncIterator[ChatStreamMessage]:
    """
    Create streaming chat using per-request ClaudeSDKClient with resume.

    Each HTTP request creates a new client instance. For follow-up messages,
    the resume parameter loads previous conversation history.

    Args:
        message: User message to send
        session_id: Conversation ID (used for resume parameter)
        is_resuming: Whether this is resuming an existing conversation

    Yields:
        ChatStreamMessage: Wrapped SDK messages
    """
    # Configure client options
    if is_resuming:
        # Resume existing conversation
        options = ClaudeAgentOptions(
            resume=session_id,
            permission_mode='bypassPermissions',
            include_partial_messages=True,
        )
        logger.info(f"Resuming conversation with session_id: {session_id}")
    else:
        # New conversation
        options = ClaudeAgentOptions(
            permission_mode='bypassPermissions',
            include_partial_messages=True,
        )
        logger.info(f"Starting new conversation")

    try:
        logger.info(f"Starting chat stream - message: {message[:100]}")

        # Mark session as active
        await session_manager.mark_active(session_id)

        # Use async context manager for proper lifecycle
        async with ClaudeSDKClient(options=options) as client:
            logger.info("ClaudeSDKClient context manager entered")

            # Send query
            logger.info(f"Sending query: {message[:50]}")
            await client.query(message)
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
        # Mark session as inactive
        await session_manager.mark_inactive(session_id)
        logger.info("Chat stream completed")
