"""
RAG ingestion pipeline for processing documents into vector embeddings.
Handles idempotent batch processing of documents.
"""
import logging
from datetime import datetime, timezone
from typing import Any
from openai import OpenAI
from supabase import Client, create_client

from app.config import settings
from app.utils.tiptap_parser import TiptapParser, Chunk

logger = logging.getLogger(__name__)


class RAGIngestionPipeline:
    """Pipeline for ingesting documents into vector database"""

    def __init__(self):
        """Initialize pipeline with clients and parser"""
        self.openai_client = OpenAI(api_key=settings.openai_api_key)
        self.supabase: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key  # Use service role for backend operations
        )
        self.parser = TiptapParser()
        self.embedding_model = settings.openai_embedding_model

    def get_documents_to_index(self) -> list[dict[str, Any]]:
        """
        Fetch documents that need indexing.
        Returns documents where indexed_at is NULL or updated_at > indexed_at.
        """
        try:
            # Fetch all documents with indexing status
            # Filter in Python since Supabase doesn't support column comparisons
            response = self.supabase.table("documents") \
                .select("id, title, content, updated_at, indexed_at") \
                .execute()

            # Filter documents that need indexing
            documents = []
            for doc in response.data:
                # Index if never indexed OR updated after last index
                if doc.get("indexed_at") is None:
                    documents.append(doc)
                elif doc.get("updated_at") and doc.get("indexed_at"):
                    # Compare timestamps
                    updated = datetime.fromisoformat(doc["updated_at"].replace('Z', '+00:00'))
                    indexed = datetime.fromisoformat(doc["indexed_at"].replace('Z', '+00:00'))
                    if updated > indexed:
                        documents.append(doc)

            logger.info(f"Found {len(documents)} documents to index")
            return documents

        except Exception as e:
            logger.error(f"Error fetching documents to index: {e}")
            return []

    def generate_embedding(self, text: str) -> list[float]:
        """
        Generate embedding for text using OpenAI.

        Args:
            text: Text to embed

        Returns:
            Embedding vector (1536 dimensions for text-embedding-3-small)
        """
        try:
            response = self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            return response.data[0].embedding

        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

    def delete_existing_chunks(self, document_id: str) -> None:
        """
        Delete existing chunks for a document (for re-indexing).

        Args:
            document_id: UUID of the document
        """
        try:
            self.supabase.table("document_chunks") \
                .delete() \
                .eq("document_id", document_id) \
                .execute()

            logger.debug(f"Deleted existing chunks for document {document_id}")

        except Exception as e:
            logger.error(f"Error deleting chunks for document {document_id}: {e}")
            raise

    def store_chunks(
        self,
        document_id: str,
        document_title: str,
        chunks: list[Chunk],
        metadata: dict[str, Any]
    ) -> None:
        """
        Generate embeddings and store chunks in database.

        Args:
            document_id: UUID of the document
            document_title: Title of the document
            chunks: List of parsed chunks
            metadata: Additional metadata to store with each chunk
        """
        try:
            chunk_records = []

            for chunk in chunks:
                # Create augmented text for embedding
                embedding_text = self.parser.create_embedding_text(
                    chunk["text"],
                    document_title,
                    chunk["section_heading"]
                )

                # Generate embedding
                embedding = self.generate_embedding(embedding_text)

                # Prepare chunk record
                chunk_record = {
                    "document_id": document_id,
                    "chunk_index": chunk["chunk_index"],
                    "content": chunk["text"],  # Store original text
                    "section_heading": chunk["section_heading"],
                    "embedding": embedding,
                    "metadata": {
                        **metadata,
                        "token_count": chunk["token_count"],
                        "document_title": document_title
                    }
                }
                chunk_records.append(chunk_record)

            # Batch insert chunks
            if chunk_records:
                self.supabase.table("document_chunks").insert(chunk_records).execute()
                logger.info(f"Stored {len(chunk_records)} chunks for document {document_id}")

        except Exception as e:
            logger.error(f"Error storing chunks for document {document_id}: {e}")
            raise

    def update_indexed_at(self, document_id: str) -> None:
        """
        Update indexed_at timestamp for a document.

        Args:
            document_id: UUID of the document
        """
        try:
            self.supabase.table("documents") \
                .update({"indexed_at": datetime.now(timezone.utc).isoformat()}) \
                .eq("id", document_id) \
                .execute()

            logger.debug(f"Updated indexed_at for document {document_id}")

        except Exception as e:
            logger.error(f"Error updating indexed_at for document {document_id}: {e}")
            raise

    def process_document(self, document: dict[str, Any]) -> bool:
        """
        Process a single document: parse, chunk, embed, and store.

        Args:
            document: Document data from database

        Returns:
            True if successful, False otherwise
        """
        document_id = document["id"]
        document_title = document["title"]

        try:
            logger.info(f"Processing document: {document_title} ({document_id})")

            # Parse Tiptap JSON
            tiptap_json = document["content"]
            if not tiptap_json or not isinstance(tiptap_json, dict):
                logger.warning(f"Document {document_id} has invalid content format")
                return False

            # Parse and chunk
            chunks = self.parser.parse_and_chunk(tiptap_json, document_title)

            if not chunks:
                logger.warning(f"No chunks generated for document {document_id}")
                # Still mark as indexed to avoid reprocessing
                self.update_indexed_at(document_id)
                return True

            # Delete existing chunks (for re-indexing)
            self.delete_existing_chunks(document_id)

            # Store chunks with embeddings
            metadata = {
                "updated_at": document.get("updated_at")
            }
            self.store_chunks(document_id, document_title, chunks, metadata)

            # Update indexed_at
            self.update_indexed_at(document_id)

            logger.info(f"Successfully processed document {document_id} ({len(chunks)} chunks)")
            return True

        except Exception as e:
            logger.error(f"Failed to process document {document_id}: {e}", exc_info=True)
            return False

    def run(self) -> dict[str, int]:
        """
        Run the ingestion pipeline.
        Processes all documents that need indexing.

        Returns:
            Statistics about the run (processed, failed, skipped)
        """
        logger.info("Starting RAG ingestion pipeline")

        # Get documents to process
        documents = self.get_documents_to_index()

        if not documents:
            logger.info("No documents to process")
            return {"processed": 0, "failed": 0, "skipped": 0}

        # Process each document
        stats = {"processed": 0, "failed": 0, "skipped": 0}

        for document in documents:
            success = self.process_document(document)
            if success:
                stats["processed"] += 1
            else:
                stats["failed"] += 1

        logger.info(
            f"RAG ingestion pipeline completed: "
            f"{stats['processed']} processed, "
            f"{stats['failed']} failed, "
            f"{stats['skipped']} skipped"
        )

        return stats


# Singleton instance
_pipeline: RAGIngestionPipeline | None = None


def get_pipeline() -> RAGIngestionPipeline:
    """Get or create the RAG ingestion pipeline instance"""
    global _pipeline
    if _pipeline is None:
        _pipeline = RAGIngestionPipeline()
    return _pipeline
