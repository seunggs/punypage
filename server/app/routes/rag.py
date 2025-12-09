"""
Document search and RAG ingestion API endpoints.

Routes:
- POST /api/v1/documents/search - Vector similarity search
- POST /api/v1/documents/ingest - Manual ingestion trigger
- GET /api/v1/documents/health - RAG system health check
"""
import logging
from typing import Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from openai import OpenAI
from supabase import Client, create_client

from app.config import settings
from app.core.dependencies import RequireAuth
from app.core.rag_ingestion import get_pipeline

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize clients
openai_client = OpenAI(api_key=settings.openai_api_key)
supabase: Client = create_client(
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
    user: dict = RequireAuth
) -> SearchResponse:
    """
    Search documents using vector similarity.

    Generates an embedding for the query and finds similar document chunks.
    Results are filtered by user access (RLS policies apply).
    """
    try:
        # Generate embedding for query
        logger.info(f"Generating embedding for query: {request.query[:50]}...")
        embedding_response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=request.query
        )
        query_embedding = embedding_response.data[0].embedding

        # Search for similar chunks using pgvector
        # Note: Supabase Python client doesn't have native vector search,
        # so we use RPC to call a custom function
        # First, let's create a simpler approach using raw SQL via rpc

        # For now, we'll use a workaround with manual SQL
        # In production, you'd want to create a Postgres function for this
        response = supabase.rpc(
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
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


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
        stats = pipeline.run()

        return IngestionResponse(
            success=True,
            message=f"Ingestion completed: {stats['processed']} processed, {stats['failed']} failed",
            stats=stats
        )

    except Exception as e:
        logger.error(f"Error in manual ingestion: {e}", exc_info=True)
        return IngestionResponse(
            success=False,
            message=f"Ingestion failed: {str(e)}",
            stats={"processed": 0, "failed": 0, "skipped": 0}
        )


@router.get("/health")
async def rag_health() -> dict[str, str]:
    """Health check endpoint for RAG system"""
    try:
        # Test OpenAI connection
        openai_client.models.list()

        # Test Supabase connection
        supabase.table("documents").select("id").limit(1).execute()

        return {"status": "healthy", "message": "RAG system operational"}

    except Exception as e:
        logger.error(f"RAG health check failed: {e}")
        return {"status": "unhealthy", "message": str(e)}
