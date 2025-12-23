import { useMutation } from '@tanstack/react-query';
import { searchDocuments } from '@/lib/ragApi';
import type { SearchQuery } from '../types';

export function useDocumentSearch() {
  return useMutation({
    mutationFn: (query: SearchQuery) => searchDocuments(query),
  });
}
