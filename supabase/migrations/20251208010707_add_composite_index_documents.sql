-- Add composite index for common query pattern: filtering by user_id and is_folder
-- This improves performance for queries like "get all folders for a user" or "get all documents (non-folders) for a user"
CREATE INDEX IF NOT EXISTS idx_documents_user_folder ON documents(user_id, is_folder);

-- Add comment for clarity
COMMENT ON INDEX idx_documents_user_folder IS 'Composite index for filtering documents by user and folder status';
