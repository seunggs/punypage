-- Convert documents.content from JSONB to TEXT for markdown storage
-- Agent works with markdown natively, UI handles conversion to Tiptap JSON

ALTER TABLE documents
  ALTER COLUMN content TYPE TEXT
  USING CASE
    -- Handle empty JSONB (stored as '""')
    WHEN content::text = '""' THEN ''
    -- Handle null
    WHEN content IS NULL THEN ''
    -- Otherwise convert JSONB to text and strip quotes
    ELSE TRIM(BOTH '"' FROM content::text)
  END;

-- Update default value to empty string
ALTER TABLE documents
  ALTER COLUMN content SET DEFAULT '';

-- Add comment for clarity
COMMENT ON COLUMN documents.content IS 'Document content stored as markdown text. UI converts to Tiptap JSON for rendering.';
