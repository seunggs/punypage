from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.routes import health, chat, rag
from app.core.middleware import RequestLoggingMiddleware
from app.core.scheduler import get_scheduler

# Configure logging
logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info(f"Starting server on {settings.host}:{settings.port}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Frontend URL: {settings.frontend_url}")

    # Start RAG ingestion scheduler
    scheduler = get_scheduler(interval_seconds=60)  # 1 minute
    scheduler.start()
    logger.info("RAG ingestion scheduler started")

    yield

    # Stop scheduler on shutdown
    await scheduler.stop()
    logger.info("Shutting down server")


# Initialize FastAPI app
app = FastAPI(
    title="Punypage API",
    description="Backend API for Punypage application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware - supports dynamic frontend URL from worktree
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],  # Dynamically set via env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(RequestLoggingMiddleware)

# Register routes
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(rag.router, prefix="/api/v1/documents", tags=["documents"])

