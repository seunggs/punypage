"""
Document search and RAG ingestion API endpoints.

Routes:
- POST /api/v1/documents/search - Vector similarity search
- POST /api/v1/documents/ingest - Manual ingestion trigger
- GET /api/v1/documents/health - RAG system health check
"""
import asyncio
import logging
from typing import Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from supabase import Client, create_client

from app.config import settings
from app.core.dependencies import RequireAuth, get_user_supabase_client
from app.core.rag_ingestion import get_pipeline

logger = logging.getLogger(__name__)
router = APIRouter()

# Service role client for admin operations (health checks, ingestion)
service_supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)


class SearchRequest(BaseModel):
    """Request model for vector search"""
    query: str = Field(..., min_length=1, max_length=1000, description="Search query")
    limit: int = Field(5, ge=1, le=20, description="Number of results to return")
    similarity_threshold: float = Field(
        0.7,
        ge=0.0,
        le=1.0,
        description="Minimum similarity threshold (0-1)"
    )


class SearchResult(BaseModel):
    """Single search result"""
    chunk_id: str
    document_id: str
    document_title: str
    document_path: str
    section_heading: str | None
    content: str
    similarity_score: float
    metadata: dict[str, Any]


class SearchResponse(BaseModel):
    """Response model for vector search"""
    query: str
    results: list[SearchResult]
    count: int


class IngestionResponse(BaseModel):
    """Response model for manual ingestion trigger"""
    success: bool
    message: str
    stats: dict[str, int]


@router.post("/search", response_model=SearchResponse)
async def search_documents(
    request: SearchRequest,
    user: dict = RequireAuth,
    user_supabase: Client = Depends(get_user_supabase_client)
) -> SearchResponse:
    """
    Search documents using vector similarity.

    Generates an embedding for the query and finds similar document chunks.
    Results are filtered by user access via RLS policies enforced by auth.uid().
    """
    try:
        # Get OpenAI client from pipeline (shared instance)
        pipeline = get_pipeline()
        openai_client = pipeline.openai_client

        # Generate embedding for query
        logger.info(f"Generating embedding for query: {request.query[:50]}...")
        embedding_response = openai_client.embeddings.create(
            model=settings.openai_embedding_model,
            input=request.query
        )
        query_embedding = embedding_response.data[0].embedding

        # Search using user-scoped client (RLS enforced via auth.uid() in SQL function)
        response = user_supabase.rpc(
            "search_document_chunks",
            {
                "query_embedding": query_embedding,
                "match_threshold": request.similarity_threshold,
                "match_count": request.limit
            }
        ).execute()

        # Parse results
        results = []
        for row in response.data:
            results.append(SearchResult(
                chunk_id=row["id"],
                document_id=row["document_id"],
                document_title=row["metadata"].get("document_title", "Untitled"),
                document_path=row["document_path"],
                section_heading=row["section_heading"],
                content=row["content"],
                similarity_score=row["similarity"],
                metadata=row["metadata"]
            ))

        logger.info(f"Found {len(results)} results for query")

        return SearchResponse(
            query=request.query,
            results=results,
            count=len(results)
        )

    except Exception as e:
        logger.error(f"Error in vector search: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Search failed: {str(e)}")


@router.post("/ingest", response_model=IngestionResponse)
async def trigger_ingestion(user: dict = RequireAuth) -> IngestionResponse:
    """
    Manually trigger RAG ingestion pipeline.

    Useful for testing or forcing immediate indexing of new documents.
    Requires authentication.
    """
    try:
        logger.info("Manual ingestion triggered")
        pipeline = get_pipeline()

        # Run blocking operation in executor to avoid blocking event loop
        loop = asyncio.get_event_loop()
        stats = await loop.run_in_executor(None, pipeline.run)

        return IngestionResponse(
            success=True,
            message=f"Ingestion completed: {stats['processed']} processed, {stats['failed']} failed",
            stats=stats
        )

    except Exception as e:
        logger.error(f"Error in manual ingestion: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(e)}"
        )


@router.get("/health")
async def rag_health() -> dict[str, str]:
    """Health check endpoint for RAG system"""
    try:
        # Get OpenAI client from pipeline
        pipeline = get_pipeline()
        openai_client = pipeline.openai_client

        # Test OpenAI connection
        openai_client.models.list()

        # Test Supabase connection
        service_supabase.table("documents").select("id").limit(1).execute()

        return {"status": "healthy", "message": "RAG system operational"}

    except Exception as e:
        logger.error(f"RAG health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "unhealthy", "message": str(e)}
        )
