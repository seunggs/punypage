"""
Session management for WebSocket-based persistent conversations.

Maintains long-lived ClaudeSDKClient instances, one per WebSocket connection.
"""
import asyncio
from typing import Dict, Optional
import logging
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

logger = logging.getLogger(__name__)


class SessionManager:
    """
    Manages long-lived ClaudeSDKClient instances for WebSocket connections.

    Each WebSocket connection gets one ClaudeSDKClient that persists for
    the lifetime of the connection, enabling true conversational continuity.
    """

    def __init__(self):
        self._clients: Dict[str, ClaudeSDKClient] = {}
        self._lock = asyncio.Lock()

    async def get_or_create_client(
        self,
        session_id: str,
        options: ClaudeAgentOptions
    ) -> tuple[ClaudeSDKClient, bool]:
        """
        Get existing ClaudeSDKClient or create a new one. Idempotent.

        Args:
            session_id: Unique session identifier
            options: Client configuration options (used only if creating new)

        Returns:
            Tuple of (ClaudeSDKClient, was_created)
            - was_created=False: Existing client returned (reconnection)
            - was_created=True: New client created

        Note:
            Safe to call multiple times with same session_id.
            Useful for WebSocket reconnections.
        """
        async with self._lock:
            if session_id in self._clients:
                logger.info(f"Returning existing client for session: {session_id}")
                return self._clients[session_id], False

            # Create new client
            client = ClaudeSDKClient(options=options)
            await client.connect()
            self._clients[session_id] = client
            logger.info(f"Created new client for session: {session_id}")
            return client, True

    async def get_client(self, session_id: str) -> Optional[ClaudeSDKClient]:
        """
        Get the ClaudeSDKClient for a session.

        Args:
            session_id: Session identifier

        Returns:
            ClaudeSDKClient if exists, None otherwise
        """
        async with self._lock:
            return self._clients.get(session_id)

    async def remove_client(self, session_id: str) -> None:
        """
        Remove and disconnect a ClaudeSDKClient.

        Args:
            session_id: Session identifier
        """
        async with self._lock:
            if session_id in self._clients:
                client = self._clients[session_id]
                try:
                    await client.disconnect()
                except Exception as e:
                    logger.error(f"Error disconnecting client for session {session_id}: {e}")
                del self._clients[session_id]
                logger.info(f"Removed client for session: {session_id}")

    async def interrupt_session(self, session_id: str) -> None:
        """
        Interrupt active processing in a session.

        Args:
            session_id: Session to interrupt

        Raises:
            KeyError: If session_id doesn't exist
        """
        async with self._lock:
            if session_id not in self._clients:
                logger.error(f"Attempted to interrupt non-existent session: {session_id}")
                raise KeyError(f"Session {session_id} not found")

            client = self._clients[session_id]
            try:
                await client.interrupt()
                logger.info(f"Interrupted session: {session_id}")
            except Exception as e:
                logger.error(f"Failed to interrupt session {session_id}: {e}")
                raise


# Singleton instance
session_manager = SessionManager()
