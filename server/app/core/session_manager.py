"""
Session management for WebSocket-based persistent conversations.

Maintains long-lived ClaudeSDKClient instances, one per WebSocket connection.
"""
import asyncio
from typing import Dict, Optional, Callable
import logging
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, HookMatcher
from app.constants import DOCUMENT_MUTATION_TOOLS

logger = logging.getLogger(__name__)


class SessionManager:
    """
    Manages long-lived ClaudeSDKClient instances for WebSocket connections.

    Each WebSocket connection gets one ClaudeSDKClient that persists for
    the lifetime of the connection, enabling true conversational continuity.
    """

    def __init__(self):
        self._clients: Dict[str, ClaudeSDKClient] = {}
        self._cache_queues: Dict[str, asyncio.Queue] = {}  # Persist queues with clients
        self._lock = asyncio.Lock()

    async def get_or_create_client(
        self,
        session_id: str,
        options: ClaudeAgentOptions
    ) -> tuple[ClaudeSDKClient, bool, asyncio.Queue]:
        """
        Get existing ClaudeSDKClient or create a new one. Idempotent.

        Args:
            session_id: Unique session identifier
            options: Client configuration options (used only if creating new)

        Returns:
            Tuple of (ClaudeSDKClient, was_created, cache_queue)
            - was_created=False: Existing client returned (reconnection)
            - was_created=True: New client created
            - cache_queue: Persistent queue for cache invalidation events

        Note:
            Safe to call multiple times with same session_id.
            Useful for WebSocket reconnections.
        """
        async with self._lock:
            if session_id in self._clients:
                logger.info(f"Returning existing client for session: {session_id}")
                cache_queue = self._cache_queues[session_id]
                return self._clients[session_id], False, cache_queue

            # Create persistent cache queue for this session
            cache_queue = asyncio.Queue()
            self._cache_queues[session_id] = cache_queue

            # Add PostToolUse hook for cache invalidation
            # Instead of using a callback, put events directly in the queue
            async def post_tool_use_hook(input_data, tool_use_id, context):
                """Hook that fires after document operations to trigger cache invalidation"""
                logger.debug(f"[POST TOOL USE HOOK] Fired! input_data keys: {input_data.keys()}")
                logger.debug(f"[POST TOOL USE HOOK] tool_use_id: {tool_use_id}")

                tool_name = input_data.get('tool_name', '')
                tool_response = input_data.get('tool_response', {})

                logger.debug(f"[POST TOOL USE HOOK] Extracted tool_name: {tool_name}")

                # Check if this is a document operation
                if tool_name in DOCUMENT_MUTATION_TOOLS:
                    logger.info(f"Cache invalidation queued for {tool_name}")
                    # Put directly in the persistent queue - no callback needed
                    await cache_queue.put({
                        'tool_name': tool_name,
                        'tool_response': tool_response
                    })
                    logger.debug(f"[POST TOOL USE HOOK] Event queued. Queue size: {cache_queue.qsize()}")
                else:
                    logger.debug(f"[POST TOOL USE HOOK] Tool {tool_name} is not a document operation")

                return {}

            # Add hook to options
            logger.debug(f"[HOOK REGISTRATION] Registering PostToolUse hook for cache invalidation")
            existing_hooks = options.hooks or {}
            post_tool_use_hooks = existing_hooks.get('PostToolUse', [])
            post_tool_use_hooks.append(
                HookMatcher(
                    matcher='mcp__punypage_internal__(create_document|update_document)',
                    hooks=[post_tool_use_hook],
                    timeout=30
                )
            )
            existing_hooks['PostToolUse'] = post_tool_use_hooks
            options.hooks = existing_hooks
            logger.debug(f"[HOOK REGISTRATION] PostToolUse hook registered")

            # Create new client
            client = ClaudeSDKClient(options=options)
            await client.connect()
            self._clients[session_id] = client
            logger.info(f"Created new client for session: {session_id}")
            return client, True, cache_queue

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

    async def get_cache_queue(self, session_id: str) -> Optional[asyncio.Queue]:
        """
        Get the cache queue for a session.

        Args:
            session_id: Session identifier

        Returns:
            asyncio.Queue if exists, None otherwise
        """
        async with self._lock:
            return self._cache_queues.get(session_id)

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
                # Also clean up the cache queue
                if session_id in self._cache_queues:
                    del self._cache_queues[session_id]
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
