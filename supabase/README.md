# Supabase Migrations

## Setup

1. Run the migration in your Supabase SQL Editor or using Supabase CLI:

```bash
supabase db push
```

Or manually execute the SQL in `migrations/20250114000000_create_chat_tables.sql` in your Supabase SQL Editor.

## Tables

### chat_sessions
Stores chat session metadata and SDK session IDs for resume capability.

### chat_messages
Stores individual messages within chat sessions.
