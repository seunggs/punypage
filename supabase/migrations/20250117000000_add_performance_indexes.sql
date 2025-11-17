-- Add missing performance indexes for chat tables

-- Index for sdk_session_id lookups (used for session resume)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_sdk_session_id 
ON chat_sessions(sdk_session_id);

-- Index for user_id lookups (for future auth implementation)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id 
ON chat_sessions(user_id);

-- Composite index for user_id + created_at (for user's recent chats)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_created 
ON chat_sessions(user_id, created_at DESC);
