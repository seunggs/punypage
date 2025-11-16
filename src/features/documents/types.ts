export type DocumentStatus = 'draft' | 'published' | 'archived';

export interface Document {
  id: string;
  title: string;
  content: string;
  user_id: string;
  status: DocumentStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentInput {
  title: string;
  content: string;
  status?: DocumentStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  status?: DocumentStatus;
  metadata?: Record<string, unknown>;
}
