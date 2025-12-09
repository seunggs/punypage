-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add indexed_at column to documents table to track indexing status
ALTER TABLE documents
  ADD COLUMN indexed_at TIMESTAMPTZ DEFAULT NULL;

-- Create index to efficiently find documents that need indexing
CREATE INDEX idx_documents_needs_indexing ON documents(updated_at, indexed_at)
  WHERE indexed_at IS NULL OR updated_at > indexed_at;

-- Create document_chunks table for storing chunked content with embeddings
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  section_heading TEXT,
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimensions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique chunk index per document
  UNIQUE(document_id, chunk_index)
);

-- Create indices for efficient querying
CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Enable Row Level Security for document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_chunks (inherit from documents table)
-- Users can only access chunks from documents they own
CREATE POLICY "Users can view chunks from their documents"
  ON document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
      AND (auth.uid() = documents.user_id OR documents.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert chunks for their documents"
  ON document_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
      AND (auth.uid() = documents.user_id OR documents.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update chunks from their documents"
  ON document_chunks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
      AND (auth.uid() = documents.user_id OR documents.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete chunks from their documents"
  ON document_chunks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
      AND (auth.uid() = documents.user_id OR documents.user_id IS NULL)
    )
  );
