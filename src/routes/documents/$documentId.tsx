import { createFileRoute } from '@tanstack/react-router';
import { ChatPanel } from '@/features/chat/components/ChatPanel';
import { DocumentPanel } from '@/features/documents/components/DocumentPanel';
import { useDocumentChat } from '@/features/chat/hooks/useDocumentChat';

export const Route = createFileRoute('/documents/$documentId')({
  component: DocumentView,
});

function DocumentView() {
  const { documentId } = Route.useParams();
  const { data: chatSession, isLoading } = useDocumentChat(documentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-gray-500">Loading...</div>
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
      <div className="overflow-auto border-l">
        <DocumentPanel documentId={documentId} />
      </div>
    </>
  );
}
