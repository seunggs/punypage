import { Link } from '@tanstack/react-router';
import { FileText } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import type { Document } from '../types';

interface DocumentListItemProps {
  document: Document;
}

export function DocumentListItem({ document }: DocumentListItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link
          to="/documents/$documentId"
          params={{ documentId: document.id }}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4 text-gray-400" strokeWidth={1.8} />
          <span className="truncate text-gray-700 dark:text-gray-200">{document.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
