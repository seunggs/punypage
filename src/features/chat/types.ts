export interface ChatSession {
  id: string;
  document_id: string | null;
  sdk_session_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  message_uuid: string | null;
  created_at: string;
}

export interface CreateChatSessionInput {
  document_id: string;
  user_id?: string;
  sdk_session_id?: string;
}

export interface UpdateChatSessionInput {
  sdk_session_id?: string;
}
