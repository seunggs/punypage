from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


async def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security)
) -> dict:
    """
    Verify Supabase JWT token from Authorization header
    Returns decoded token payload

    Usage: Add to route as dependency to protect it
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )

    if not settings.supabase_jwt_secret:
        logger.warning("SUPABASE_JWT_SECRET not set - skipping auth")
        return {}  # Skip auth in development

    try:
        # Verify and decode JWT
        payload = jwt.decode(
            credentials.credentials,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )


# Optional dependency - use when auth is required
RequireAuth = Depends(verify_supabase_token)
