"""
Shared constants for the application.
"""

# MCP Tool Names
MCP_TOOL_CREATE_DOCUMENT = 'mcp__punypage_internal__create_document'
MCP_TOOL_UPDATE_DOCUMENT = 'mcp__punypage_internal__update_document'

# Document operation tools that trigger cache invalidation
DOCUMENT_MUTATION_TOOLS = [
    MCP_TOOL_CREATE_DOCUMENT,
    MCP_TOOL_UPDATE_DOCUMENT,
]
