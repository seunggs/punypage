"""Auth dependencies for FastAPI routes"""
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging
from supabase import create_client, Client

from app.config import settings

logger = logging.getLogger(__name__)

# HTTP Bearer security scheme
security = HTTPBearer()

# Singleton Supabase client for auth validation
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Get or create Supabase client for auth validation"""
    global _supabase_client

    if _supabase_client is None:
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )

    return _supabase_client


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Validate JWT token from Authorization header and return user_id.

    For HTTP endpoints only.

    Returns:
        user_id string

    Raises:
        HTTPException: If user is not authenticated or token is invalid
    """
    token = credentials.credentials

    try:
        # Validate token with Supabase
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = user_response.user.id
        logger.debug(f"Authenticated user: {user_id}")

        return user_id

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation failed: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


def validate_websocket_token(token: str) -> str:
    """
    Validate JWT token and return user_id.

    Args:
        token: JWT token string

    Returns:
        user_id string

    Raises:
        HTTPException: If token is invalid
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Validate token with Supabase
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = user_response.user.id
        logger.debug(f"Authenticated WebSocket user: {user_id}")

        return user_id

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"WebSocket token validation failed: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
