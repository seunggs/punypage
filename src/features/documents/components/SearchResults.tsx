import { Skeleton } from '@/components/ui/skeleton';
import { SearchResultItem } from './SearchResultItem';
import type { SearchResponse } from '../types';

interface SearchResultsProps {
  data?: SearchResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
}

export function SearchResults({ data, isLoading, isError, error }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-800">
            {error?.message || 'An error occurred while searching'}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (data.results.length === 0) {
    return (
      <div className="w-full max-w-2xl">
        <div className="text-center py-8 text-gray-500">
          <p>No results found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-3">
      {data.results.map((result) => (
        <SearchResultItem key={result.documentId} result={result} />
      ))}
    </div>
  );
}
