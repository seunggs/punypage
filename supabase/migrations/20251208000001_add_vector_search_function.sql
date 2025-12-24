-- Create function for vector similarity search
-- Returns top-k most similar chunks using cosine similarity
-- Filters results to only include chunks from documents owned by the authenticated user
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  document_path text,
  content text,
  section_heading text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    documents.path,
    document_chunks.content,
    document_chunks.section_heading,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  INNER JOIN documents ON documents.id = document_chunks.document_id
  WHERE (filter_user_id IS NULL OR documents.user_id = filter_user_id)
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_document_chunks TO anon;
