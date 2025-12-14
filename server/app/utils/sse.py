import json


def format_sse_event(event: str, data: dict) -> str:
    """
    Format Server-Sent Event according to SSE specification

    Args:
        event: Event type (e.g., 'message', 'done', 'error')
        data: Event data (will be JSON serialized)

    Returns:
        Formatted SSE string with double newline terminator
    """
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"
