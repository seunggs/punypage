import { Link } from '@tanstack/react-router';
import type { SearchResult } from '../types';

interface SearchResultItemProps {
  result: SearchResult;
}

export function SearchResultItem({ result }: SearchResultItemProps) {
  return (
    <Link
      to="/documents/$documentId"
      params={{ documentId: result.documentId }}
      className="block w-full bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
    >
      <h3 className="font-semibold text-gray-900">{result.title}</h3>
      <p className="text-sm text-gray-500">
        {result.path}
        {result.sectionHeading && ` • ${result.sectionHeading}`}
      </p>
      {result.excerpt && (
        <p className="text-sm text-gray-700 mt-1 line-clamp-2">{result.excerpt}</p>
      )}
    </Link>
  );
}
