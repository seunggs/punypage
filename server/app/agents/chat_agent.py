from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AssistantMessage, TextBlock
from claude_agent_sdk.mcp import StdioServerParameters
from typing import AsyncIterator, Optional
import logging
import os
import sys
from pathlib import Path

from app.core.active_clients import active_clients

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

    def get_tool_use(self) -> Optional[dict]:
        """Extract tool use event from StreamEvent"""
        if hasattr(self.raw, 'event') and isinstance(self.raw.event, dict):
            event_type = self.raw.event.get('type')
            if event_type == 'content_block_start':
                content_block = self.raw.event.get('content_block', {})
                if content_block.get('type') == 'tool_use':
                    tool_use = {
                        'tool_use_id': content_block.get('id'),
                        'tool_name': content_block.get('name'),
                        'input': content_block.get('input', {})
                    }
                    logger.info(f"Extracted tool use: {tool_use['tool_name']}")
                    return tool_use
        return None

    def get_tool_result(self) -> Optional[dict]:
        """Extract tool result from message"""
        # Tool results come as part of the message content
        # The SDK handles tool execution internally, but we can observe results
        # by checking for tool_result type content blocks
        if hasattr(self.raw, 'content') and isinstance(self.raw.content, list):
            for block in self.raw.content:
                if hasattr(block, 'type') and block.type == 'tool_result':
                    result = {
                        'tool_use_id': getattr(block, 'tool_use_id', None),
                        'content': getattr(block, 'content', None),
                        'is_error': getattr(block, 'is_error', False)
                    }
                    logger.info(f"Extracted tool result for: {result['tool_use_id']}")
                    return result
        return None


async def create_chat_stream(
    message: str,
    session_id: Optional[str] = None,
    request_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> AsyncIterator[ChatStreamMessage]:
    """
    Create streaming chat using ClaudeSDKClient (per-request pattern)

    Args:
        message: User message to send
        session_id: Optional session ID to resume conversation
        request_id: Optional request ID for interrupt support
        user_id: Optional user ID for MCP server (for document operations)

    Yields:
        ChatStreamMessage: Wrapped SDK messages
    """
    # Get project root (server directory)
    server_dir = Path(__file__).parent.parent.parent

    # Prepare environment for MCP server subprocess
    mcp_env = os.environ.copy()
    mcp_env['PUNYPAGE_USER_ID'] = user_id or 'anonymous'

    # Configure client options with MCP server
    options = ClaudeAgentOptions(
        permission_mode='bypassPermissions',
        include_partial_messages=True,  # Enable real-time streaming
        mcp_servers={
            "punypage_internal": StdioServerParameters(
                command="uv",
                args=[
                    "run",
                    "--directory",
                    str(server_dir),
                    "python",
                    "-m",
                    "mcp_servers.punypage_internal"
                ],
                env=mcp_env
            )
        }
    )

    try:
        logger.info(f"Starting chat stream - request_id: {request_id}, session_id: {session_id or 'new'}, message: {message[:100]}")

        # Use async context manager for proper lifecycle
        async with ClaudeSDKClient(options=options) as client:
            logger.info("ClaudeSDKClient context manager entered")

            # Store client for interrupt capability
            if request_id:
                await active_clients.store_client(request_id, client)

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
        # Clean up client from manager
        if request_id:
            await active_clients.remove_client(request_id)
        logger.info("Chat stream completed")
