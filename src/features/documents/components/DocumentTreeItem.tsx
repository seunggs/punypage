import { Link } from '@tanstack/react-router';
import { FileText } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import type { TreeNode } from '../utils/buildDocumentTree';

interface DocumentTreeItemProps {
  node: TreeNode;
}

export function DocumentTreeItem({ node }: DocumentTreeItemProps) {
  if (!node.document) return null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link
          to="/documents/$documentId"
          params={{ documentId: node.document.id }}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4 text-gray-400" strokeWidth={1.8} />
          <span className="truncate text-gray-700 dark:text-gray-200">
            {node.name}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
