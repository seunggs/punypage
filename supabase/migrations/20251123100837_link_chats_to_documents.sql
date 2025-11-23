-- Add document_id to chat_sessions (1:1 relationship)
ALTER TABLE chat_sessions
  ADD COLUMN document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  ADD CONSTRAINT unique_document_chat UNIQUE (document_id);

-- Add index for document-based queries
CREATE INDEX idx_chat_sessions_document_id ON chat_sessions(document_id);

-- Modify documents table: change content to JSONB for future rich editor
ALTER TABLE documents
  ALTER COLUMN content TYPE JSONB USING to_jsonb(content),
  ALTER COLUMN content SET DEFAULT '""'::jsonb;

-- Add path column for future directory tree
ALTER TABLE documents
  ADD COLUMN path TEXT NOT NULL DEFAULT '/';

-- Add index for path queries (future tree structure)
CREATE INDEX idx_documents_path ON documents(path);
