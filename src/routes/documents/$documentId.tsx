import { createFileRoute } from '@tanstack/react-router';
import { ChatPanel } from '@/features/chat/components/ChatPanel';
import { DocumentPanel } from '@/features/documents/components/DocumentPanel';
import { useDocumentChat } from '@/features/chat/hooks/useDocumentChat';
import { useDocument } from '@/features/documents/hooks/useDocument';

export const Route = createFileRoute('/documents/$documentId')({
  component: DocumentView,
});

function DocumentView() {
  const { documentId } = Route.useParams();

  // First verify document exists before creating chat session
  const { data: document, isLoading: documentLoading } = useDocument(documentId);

  // Only get/create chat session if document exists
  const { data: chatSession, isLoading: chatLoading } = useDocumentChat(
    document ? documentId : ''
  );

  if (documentLoading || chatLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-gray-500">Document not found</div>
      </div>
    );
  }

  if (!chatSession) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-gray-500">Failed to load chat session</div>
      </div>
    );
  }

  return (
    <>
      {/* ChatPanel renders in left grid column */}
      <div className="overflow-auto">
        <ChatPanel session={chatSession} />
      </div>

      {/* DocumentPanel renders in right grid column */}
      <div className="overflow-auto border-l border-gray-200 dark:border-gray-800">
        <DocumentPanel documentId={documentId} />
      </div>
    </>
  );
}
