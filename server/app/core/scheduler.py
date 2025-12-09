"""
Background scheduler for periodic RAG ingestion.
Runs ingestion pipeline every 5 minutes in development.
"""
import asyncio
import logging
from datetime import datetime

from app.core.rag_ingestion import get_pipeline

logger = logging.getLogger(__name__)


class RAGScheduler:
    """Background scheduler for RAG ingestion"""

    def __init__(self, interval_seconds: int = 300):  # 5 minutes default
        """
        Initialize scheduler.

        Args:
            interval_seconds: Interval between ingestion runs (default: 300 = 5 minutes)
        """
        self.interval_seconds = interval_seconds
        self.task: asyncio.Task | None = None
        self.running = False

    async def _run_ingestion(self) -> None:
        """Run the ingestion pipeline (blocking operation in thread pool)"""
        try:
            logger.info("Running scheduled RAG ingestion")
            start_time = datetime.now()

            # Run in thread pool since it's sync code
            loop = asyncio.get_event_loop()
            pipeline = get_pipeline()
            stats = await loop.run_in_executor(None, pipeline.run)

            duration = (datetime.now() - start_time).total_seconds()
            logger.info(
                f"RAG ingestion completed in {duration:.2f}s: "
                f"{stats['processed']} processed, {stats['failed']} failed"
            )

        except Exception as e:
            logger.error(f"Error in scheduled RAG ingestion: {e}", exc_info=True)

    async def _scheduler_loop(self) -> None:
        """Main scheduler loop"""
        logger.info(f"RAG scheduler started (interval: {self.interval_seconds}s)")

        # Run immediately on startup
        await self._run_ingestion()

        # Then run periodically
        while self.running:
            try:
                await asyncio.sleep(self.interval_seconds)
                if self.running:  # Check again after sleep
                    await self._run_ingestion()

            except asyncio.CancelledError:
                logger.info("RAG scheduler cancelled")
                break
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}", exc_info=True)
                # Continue running even if one iteration fails

    def start(self) -> None:
        """Start the scheduler"""
        if self.running:
            logger.warning("RAG scheduler already running")
            return

        self.running = True
        self.task = asyncio.create_task(self._scheduler_loop())
        logger.info("RAG scheduler task created")

    async def stop(self) -> None:
        """Stop the scheduler gracefully"""
        if not self.running:
            return

        logger.info("Stopping RAG scheduler")
        self.running = False

        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

        logger.info("RAG scheduler stopped")


# Singleton instance
_scheduler: RAGScheduler | None = None


def get_scheduler(interval_seconds: int = 300) -> RAGScheduler:
    """Get or create the scheduler instance"""
    global _scheduler
    if _scheduler is None:
        _scheduler = RAGScheduler(interval_seconds)
    return _scheduler
