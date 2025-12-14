-- Create function for vector similarity search
-- This function performs cosine similarity search on document chunks
-- Filters results to only include chunks from documents owned by the authenticated user
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  section_heading text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.section_heading,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  INNER JOIN documents ON documents.id = document_chunks.document_id
  WHERE documents.user_id = auth.uid()
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_document_chunks TO anon;
