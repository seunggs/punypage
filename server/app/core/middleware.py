from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import time

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs all incoming requests and their duration"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Log request
        logger.info(f"{request.method} {request.url.path}")

        # Process request
        response = await call_next(request)

        # Log response
        duration = time.time() - start_time
        logger.info(
            f"{request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"Duration: {duration:.3f}s"
        )

        return response
