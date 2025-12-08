import { useState } from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar';
import type { TreeNode } from '../utils/buildDocumentTree';
import { DocumentTreeItem } from './DocumentTreeItem';

interface DocumentTreeFolderProps {
  node: TreeNode;
}

export function DocumentTreeFolder({ node }: DocumentTreeFolderProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const renderTreeNode = (childNode: TreeNode): JSX.Element => {
    if (childNode.isFolder) {
      return <DocumentTreeFolder key={childNode.id} node={childNode} />;
    }
    return <DocumentTreeItem key={childNode.id} node={childNode} />;
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setIsExpanded(!isExpanded)}
        className="group/folder flex items-center gap-2 cursor-pointer"
      >
        <div className="relative h-4 w-4">
          {/* Folder icon - hidden on hover */}
          <Folder
            className="h-4 w-4 text-gray-400 absolute group-hover/folder:opacity-0 transition-opacity duration-200"
            strokeWidth={1.8}
          />
          {/* Chevron - shown on hover */}
          <ChevronRight
            className={`h-4 w-4 text-gray-400 absolute opacity-0 group-hover/folder:opacity-100 transition-all duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
            strokeWidth={1.8}
          />
        </div>
        <span className="truncate text-gray-700 dark:text-gray-200">
          {node.name}
        </span>
      </SidebarMenuButton>

      {isExpanded && node.children.length > 0 && (
        <SidebarMenuSub>{node.children.map(renderTreeNode)}</SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
