import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarMenu } from '@/components/ui/sidebar';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentListItem } from './DocumentListItem';
import { NewDocumentDialog } from './NewDocumentDialog';

export function DocumentsList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: documents, isLoading } = useDocuments();

  return (
    <div>
      <div className="flex items-center justify-between px-2 mb-1">
        <h2 className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Documents
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="h-6 w-6 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="px-2 py-4 text-sm text-gray-500">Loading...</div>
      ) : documents && documents.length > 0 ? (
        <SidebarMenu>
          {documents.map((doc) => (
            <DocumentListItem key={doc.id} document={doc} />
          ))}
        </SidebarMenu>
      ) : (
        <div className="px-2 py-4 text-sm text-gray-500">
          No documents yet. Click + to create one.
        </div>
      )}

      <NewDocumentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
