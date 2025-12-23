-- Remove is_folder column - folders are now inferred from path
-- If a path exists, it's a folder. No need to store this explicitly.

-- Drop the index first
DROP INDEX IF EXISTS idx_documents_is_folder;

-- Drop the column
ALTER TABLE documents
  DROP COLUMN IF EXISTS is_folder;
