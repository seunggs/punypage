from fastapi import APIRouter
from datetime import datetime
import time
from app.config import settings

router = APIRouter()

start_time = time.time()


@router.get("/health")
async def health_check():
    """Health check endpoint - same format as TypeScript version"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "uptime": time.time() - start_time,
        "environment": settings.environment,
    }
