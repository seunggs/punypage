"""Manager for active ClaudeSDKClient instances to support interrupts"""
import asyncio
from typing import Dict, Optional
from claude_agent_sdk import ClaudeSDKClient
import logging

logger = logging.getLogger(__name__)


class ActiveClientsManager:
    """Thread-safe manager for active chat clients"""

    def __init__(self):
        self._clients: Dict[str, ClaudeSDKClient] = {}
        self._lock = asyncio.Lock()

    async def store_client(self, request_id: str, client: ClaudeSDKClient) -> None:
        """Store active client"""
        async with self._lock:
            self._clients[request_id] = client
            logger.info(f"Stored client for request_id: {request_id}")

    async def get_client(self, request_id: str) -> Optional[ClaudeSDKClient]:
        """Retrieve client for interrupt"""
        async with self._lock:
            return self._clients.get(request_id)

    async def remove_client(self, request_id: str) -> None:
        """Remove client after completion/interrupt"""
        async with self._lock:
            if request_id in self._clients:
                del self._clients[request_id]
                logger.info(f"Removed client for request_id: {request_id}")

    async def get_active_count(self) -> int:
        """Get count of active clients (for monitoring)"""
        async with self._lock:
            return len(self._clients)


# Singleton instance
active_clients = ActiveClientsManager()
