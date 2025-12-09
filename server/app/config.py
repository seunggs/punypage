from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, ValidationError
from typing import Literal
import sys


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

    # OpenAI
    openai_api_key: str

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    database_url: str | None = None
    supabase_jwt_secret: str | None = None  # For auth middleware

    @field_validator('anthropic_api_key')
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        """Ensure API key is not empty"""
        if not v or not v.strip():
            raise ValueError(
                "ANTHROPIC_API_KEY must be set and not empty. "
                "Please set it in your .env file or environment variables."
            )
        if not v.startswith('sk-ant-'):
            raise ValueError(
                "ANTHROPIC_API_KEY appears to be invalid. "
                "It should start with 'sk-ant-'"
            )
        return v.strip()

    @field_validator('supabase_url', 'supabase_anon_key', 'supabase_service_role_key')
    @classmethod
    def validate_supabase_required(cls, v: str) -> str:
        """Ensure required Supabase settings are not empty"""
        if not v or not v.strip():
            raise ValueError("Required Supabase configuration is missing or empty")
        return v.strip()

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )


# Singleton instance with error handling
try:
    settings = Settings()
except ValidationError as e:
    print("❌ Configuration Error:")
    for error in e.errors():
        field = ".".join(str(x) for x in error['loc'])
        print(f"  - {field}: {error['msg']}")
    print("\nPlease check your .env file and ensure all required variables are set.")
    sys.exit(1)
