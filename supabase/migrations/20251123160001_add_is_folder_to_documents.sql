-- Add is_folder column to documents table for directory tree support
ALTER TABLE documents
  ADD COLUMN is_folder BOOLEAN NOT NULL DEFAULT false;

-- Add index for filtering folders vs documents
CREATE INDEX idx_documents_is_folder ON documents(is_folder);

-- Add comment for clarity
COMMENT ON COLUMN documents.is_folder IS 'Indicates if this entry is a folder (true) or a document (false)';
