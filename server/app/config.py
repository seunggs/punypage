from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Server
    port: int = 4000
    host: str = "0.0.0.0"
    environment: Literal["development", "production"] = "development"
    log_level: str = "info"

    # CORS
    frontend_url: str = "http://localhost:5500"

    # Anthropic
    anthropic_api_key: str

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    database_url: str | None = None
    supabase_jwt_secret: str | None = None  # For auth middleware

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )


# Singleton instance
settings = Settings()
