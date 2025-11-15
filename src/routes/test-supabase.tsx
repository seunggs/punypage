import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import { useCreateDocument } from '@/features/documents/hooks/useCreateDocument';
import { useDeleteDocument } from '@/features/documents/hooks/useDeleteDocument';

export const Route = createFileRoute('/test-supabase')({
  component: TestSupabase,
});

function TestSupabase() {
  const { data: documents, isLoading, error } = useDocuments();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const [counter, setCounter] = useState(1);

  console.log('Test Supabase page loaded - testing GitHub Actions code review');

  const handleCreateDocument = () => {
    createDocument.mutate({
      title: `Test Document ${counter}`,
      content: `This is test content for document ${counter}. Created at ${new Date().toISOString()}`,
      status: 'draft',
      metadata: { test: true, counter },
    });
    setCounter(counter + 1);
  };

  const handleDeleteDocument = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocument.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Supabase CRUD Test</h1>
          <p className="text-gray-600 mb-4">
            Test creating and reading documents from Supabase
          </p>

          <Button
            onClick={handleCreateDocument}
            disabled={createDocument.isPending}
            className="mb-4"
          >
            {createDocument.isPending ? 'Creating...' : 'Add Test Document'}
          </Button>

          {createDocument.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              Error creating document:{' '}
              {createDocument.error instanceof Error
                ? createDocument.error.message
                : 'Unknown error'}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Documents</h2>

          {isLoading && (
            <div className="text-gray-600">Loading documents...</div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Error loading documents:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          )}

          {documents && documents.length === 0 && (
            <div className="text-gray-600">
              No documents yet. Click "Add Test Document" to create one.
            </div>
          )}

          {documents && documents.length > 0 && (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{doc.title}</h3>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={deleteDocument.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                  <p className="text-gray-700 mb-2">{doc.content}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      Status: {doc.status}
                    </span>
                    <span>
                      Created: {new Date(doc.created_at).toLocaleString()}
                    </span>
                  </div>
                  {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Metadata: {JSON.stringify(doc.metadata)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {deleteDocument.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
              Error deleting document:{' '}
              {deleteDocument.error instanceof Error
                ? deleteDocument.error.message
                : 'Unknown error'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
