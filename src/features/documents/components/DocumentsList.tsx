import { useState } from 'react';
import { Plus, Home, Search } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentTree } from './DocumentTree';
import { NewDocumentDialog } from './NewDocumentDialog';

export function DocumentsList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: documents, isLoading } = useDocuments();

  return (
    <div className="p-2">
      {/* Navigation Links */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4 text-gray-400" strokeWidth={1.8} />
              <span className="text-gray-700 dark:text-gray-200">Home</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link to="/documents" className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" strokeWidth={1.8} />
              <span className="text-gray-700 dark:text-gray-200">Search</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Documents Section */}
      <div className="flex items-center justify-between px-2 py-1.5 mt-4">
        <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Documents
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="h-6 w-6 p-0"
        >
          <Plus className="h-4 w-4 text-gray-500 dark:text-gray-400" strokeWidth={2} />
        </Button>
      </div>

      {isLoading ? (
        <div className="px-2 py-1.5 text-sm text-gray-500">Loading...</div>
      ) : documents && documents.length > 0 ? (
        <DocumentTree documents={documents} />
      ) : (
        <div className="px-2 py-1.5 text-sm text-gray-500">
          No documents yet. Click + to create one.
        </div>
      )}

      <NewDocumentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
