import { supabase } from './supabase';
import type {
  SearchQuery,
  SearchResponse,
  BackendSearchResponse,
  SearchResult,
} from '@/features/documents/types';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('Missing VITE_API_URL environment variable');
}

function transformBackendResponse(backendResponse: BackendSearchResponse): SearchResponse {
  return {
    query: backendResponse.query,
    count: backendResponse.count,
    results: backendResponse.results.map(
      (result): SearchResult => ({
        documentId: result.document_id,
        title: result.document_title,
        path: result.document_path,
        excerpt: result.content,
        sectionHeading: result.section_heading,
      })
    ),
  };
}

export async function searchDocuments(query: SearchQuery): Promise<SearchResponse> {
  // Get the current session token
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/v1/documents/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      query: query.query,
      limit: query.limit || 10,
      similarity_threshold: query.similarity_threshold || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Search failed: ${error}`);
  }

  const backendResponse: BackendSearchResponse = await response.json();
  return transformBackendResponse(backendResponse);
}
