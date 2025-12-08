-- Add is_folder column to documents table for directory tree support
--
-- NOTE: This migration has a later timestamp than 20251123100837_link_chats_to_documents.sql
-- which added the 'path' column. Both columns (path and is_folder) work together to
-- support the hierarchical document tree structure. The path column stores the full path
-- to the document (e.g., /AI/LLM), and is_folder indicates whether the document represents
-- a folder (organizational) or an actual document.
ALTER TABLE documents
  ADD COLUMN is_folder BOOLEAN NOT NULL DEFAULT false;

-- Add index for filtering folders vs documents
CREATE INDEX idx_documents_is_folder ON documents(is_folder);

-- Add comment for clarity
COMMENT ON COLUMN documents.is_folder IS 'Indicates if this entry is a folder (true) or a document (false)';
