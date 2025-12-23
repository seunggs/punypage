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

// Search types - Backend RAG API response format
export interface BackendSearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  document_path: string;
  section_heading: string | null;
  content: string;
  similarity_score: number;
  metadata: Record<string, any>;
}

export interface BackendSearchResponse {
  query: string;
  results: BackendSearchResult[];
  count: number;
}

// Frontend search types (transformed from backend)
export interface SearchResult {
  documentId: string;
  title: string;
  path: string;
  excerpt: string;
  sectionHeading: string | null;
}

export interface SearchQuery {
  query: string;
  limit?: number;
  similarity_threshold?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  count: number;
}
