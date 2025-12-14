"""Supabase client for MCP server"""
import os
from supabase import create_client, Client
from typing import Optional

# Singleton Supabase client
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or create Supabase client using service role key.
    Uses environment variables for configuration.
    """
    global _supabase_client

    if _supabase_client is None:
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if not supabase_url or not supabase_key:
            raise ValueError(
                "Missing required environment variables: "
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
            )

        _supabase_client = create_client(supabase_url, supabase_key)

    return _supabase_client


def get_user_id() -> str:
    """
    Get user_id from environment variable.
    Set by chat_agent when spawning MCP server process.
    """
    user_id = os.getenv('PUNYPAGE_USER_ID')

    if not user_id:
        raise ValueError(
            "Missing PUNYPAGE_USER_ID environment variable. "
            "This should be set by the chat agent."
        )

    return user_id
