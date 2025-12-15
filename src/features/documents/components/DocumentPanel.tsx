import { useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useDocument } from '../hooks/useDocument';
import { useUpdateDocument } from '../hooks/useUpdateDocument';
import { Editor } from './Editor';

interface DocumentPanelProps {
  documentId: string;
}

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function DocumentPanel({ documentId }: DocumentPanelProps) {
  const { data: document, isLoading } = useDocument(documentId);
  const updateDocument = useUpdateDocument();
  const [title, setTitle] = useState('');
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');

  // Load document title when document changes
  useEffect(() => {
    if (document) {
      setTitle(document.title);
    }
  }, [document]);

  const handleContentUpdate = (newContent: string) => {
    setAutosaveStatus('saving');
    debouncedContentSave(newContent);
  };

  const handleTitleUpdate = (newTitle: string) => {
    setTitle(newTitle);
    setAutosaveStatus('saving');
    debouncedTitleSave(newTitle);
  };

  // Debounce auto-save to prevent excessive database writes
  const debouncedContentSave = useDebouncedCallback((newContent: string) => {
    if (!document) return;

    updateDocument.mutate(
      {
        id: documentId,
        updates: {
          content: newContent,
        },
      },
      {
        onSuccess: () => {
          setAutosaveStatus('saved');
          setTimeout(() => setAutosaveStatus('idle'), 2000);
        },
        onError: (error) => {
          console.error('Failed to update document content:', error);
          setAutosaveStatus('error');
          setTimeout(() => setAutosaveStatus('idle'), 3000);
        },
      }
    );
  }, 1000);

  const debouncedTitleSave = useDebouncedCallback((newTitle: string) => {
    if (!document) return;

    updateDocument.mutate(
      {
        id: documentId,
        updates: {
          title: newTitle,
        },
      },
      {
        onSuccess: () => {
          setAutosaveStatus('saved');
          setTimeout(() => setAutosaveStatus('idle'), 2000);
        },
        onError: (error) => {
          console.error('Failed to update document title:', error);
          setAutosaveStatus('error');
          setTimeout(() => setAutosaveStatus('idle'), 3000);
        },
      }
    );
  }, 1000);

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

  const getAutosaveIndicator = () => {
    switch (autosaveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span className="text-xs text-gray-400">Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-lime-400" />
            <span className="text-xs text-gray-400">Saved</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-xs text-red-400">Failed to save</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-11 border-b">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleUpdate(e.target.value)}
          className="text-base font-normal text-gray-900 dark:text-gray-100 bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
          placeholder="Document Title"
        />
        <div className="text-xs text-gray-500">{document.path}</div>
      </div>

      {/* Content Editor */}
      <div className="flex-1 overflow-y-auto">
        <Editor key={documentId} content={document.content} onUpdate={handleContentUpdate} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-4 h-11 border-t">
        {getAutosaveIndicator()}
      </div>
    </div>
  );
}
