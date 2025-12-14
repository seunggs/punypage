"""Punypage Internal MCP Server

Provides document CRUD operations for Claude Agent.
Runs as a subprocess spawned by the chat agent.
"""
import asyncio
import logging
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from .tools.schemas import (
    CreateDocumentInput,
    UpdateDocumentInput,
    ReadDocumentInput,
    DeleteDocumentInput,
    ListDocumentsInput,
)
from .tools.documents import (
    create_document,
    update_document,
    read_document,
    delete_document,
    list_documents,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[MCP Server] %(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create MCP server instance
server = Server("punypage_internal")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools"""
    return [
        Tool(
            name="create_document",
            description="Create a new document with markdown content. Use this when the user asks to create, write, or draft a new document.",
            inputSchema=CreateDocumentInput.model_json_schema(),
        ),
        Tool(
            name="update_document",
            description="Update an existing document. Use this when the user asks to edit, modify, or update a document. Provide only the fields that need to be changed.",
            inputSchema=UpdateDocumentInput.model_json_schema(),
        ),
        Tool(
            name="read_document",
            description="Read a document by ID. Use this to retrieve document content before editing or when the user asks to view a document.",
            inputSchema=ReadDocumentInput.model_json_schema(),
        ),
        Tool(
            name="delete_document",
            description="Delete a document by ID. Use this when the user asks to delete or remove a document.",
            inputSchema=DeleteDocumentInput.model_json_schema(),
        ),
        Tool(
            name="list_documents",
            description="List documents with optional filters. Use this when the user asks to see their documents, browse a folder, or find documents in a specific location.",
            inputSchema=ListDocumentsInput.model_json_schema(),
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls"""
    logger.info(f"Tool called: {name} with arguments: {arguments}")

    try:
        if name == "create_document":
            input_data = CreateDocumentInput(**arguments)
            result = await create_document(input_data)
            return [TextContent(
                type="text",
                text=f"Successfully created document '{result.title}' (ID: {result.id}) at path '{result.path}'. Content length: {len(result.content_md)} characters."
            )]

        elif name == "update_document":
            input_data = UpdateDocumentInput(**arguments)
            result = await update_document(input_data)
            return [TextContent(
                type="text",
                text=f"Successfully updated document '{result.title}' (ID: {result.id}). Content length: {len(result.content_md)} characters."
            )]

        elif name == "read_document":
            input_data = ReadDocumentInput(**arguments)
            result = await read_document(input_data)
            return [TextContent(
                type="text",
                text=f"Document: {result.title}\nPath: {result.path}\nStatus: {result.status}\n\nContent:\n{result.content_md}"
            )]

        elif name == "delete_document":
            input_data = DeleteDocumentInput(**arguments)
            result = await delete_document(input_data)
            return [TextContent(
                type="text",
                text=f"Successfully deleted document with ID: {result.deleted_id}"
            )]

        elif name == "list_documents":
            input_data = ListDocumentsInput(**arguments)
            results = await list_documents(input_data)

            if not results:
                return [TextContent(type="text", text="No documents found.")]

            # Format as table
            lines = ["Documents:\n"]
            for doc in results:
                doc_type = "📁" if doc.is_folder else "📄"
                lines.append(f"{doc_type} {doc.title} (ID: {doc.id})")
                lines.append(f"   Path: {doc.path} | Status: {doc.status}")

            return [TextContent(type="text", text="\n".join(lines))]

        else:
            raise ValueError(f"Unknown tool: {name}")

    except Exception as e:
        logger.error(f"Tool execution failed: {e}", exc_info=True)
        return [TextContent(
            type="text",
            text=f"Error: {str(e)}"
        )]


async def main():
    """Run the MCP server"""
    logger.info("Starting Punypage Internal MCP Server...")

    async with stdio_server() as (read_stream, write_stream):
        logger.info("MCP Server running on stdio")
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
