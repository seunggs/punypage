import { useState } from 'react';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { useDocumentSearch } from '../hooks/useDocumentSearch';

export function DocumentSearchPage() {
  const [query, setQuery] = useState('');
  const { mutate, data, isPending, isError, error } = useDocumentSearch();

  const handleSearch = () => {
    if (query.trim()) {
      mutate({ query: query.trim() });
    }
  };

  return (
    <div className="flex flex-col items-center p-8 gap-6">
      <SearchInput
        value={query}
        onChange={setQuery}
        onSearch={handleSearch}
        isLoading={isPending}
      />
      <SearchResults data={data} isLoading={isPending} isError={isError} error={error || undefined} />
    </div>
  );
}
