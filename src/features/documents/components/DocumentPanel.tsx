import { useState, useEffect } from 'react';
import { useDocument } from '../hooks/useDocument';
import { useUpdateDocument } from '../hooks/useUpdateDocument';

interface DocumentPanelProps {
  documentId: string;
}

export function DocumentPanel({ documentId }: DocumentPanelProps) {
  const { data: document, isLoading } = useDocument(documentId);
  const updateDocument = useUpdateDocument();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  // Load document content when document changes
  useEffect(() => {
    if (document) {
      setTitle(document.title);
      // Handle both string and object content
      setContent(
        typeof document.content === 'string'
          ? document.content
          : JSON.stringify(document.content, null, 2)
      );
    }
  }, [document]);

  const handleSave = () => {
    if (!document) return;

    updateDocument.mutate(
      {
        id: documentId,
        updates: {
          title,
          content,
        },
      },
      {
        onError: (error) => {
          console.error('Failed to update document:', error);
          // TODO: Show error toast
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading document...</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Document not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          className="text-xl font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
          placeholder="Document Title"
        />
        <div className="text-xs text-gray-500">{document.path}</div>
      </div>

      {/* Content Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          className="w-full h-full resize-none border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100 bg-transparent font-mono text-sm"
          placeholder="Start typing your document content..."
        />
      </div>
    </div>
  );
}
