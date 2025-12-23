export type DocumentStatus = 'draft' | 'published' | 'archived';

// Json type compatible with Supabase
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Document {
  id: string;
  title: string;
  content: string; // Markdown text - UI converts to Tiptap JSON for rendering
  path: string;
  user_id: string;
  status: DocumentStatus;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentInput {
  title: string;
  path: string;
  content?: string;
  status?: DocumentStatus;
  metadata?: Json;
}

export interface UpdateDocumentInput {
  title?: string;
  path?: string;
  content?: string;
  status?: DocumentStatus;
  metadata?: Json;
}
