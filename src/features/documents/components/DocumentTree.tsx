import { useMemo } from 'react';
import { SidebarMenu } from '@/components/ui/sidebar';
import type { Document } from '../types';
import { buildDocumentTree } from '../utils/buildDocumentTree';
import type { TreeNode } from '../utils/buildDocumentTree';
import { DocumentTreeFolder } from './DocumentTreeFolder';
import { DocumentTreeItem } from './DocumentTreeItem';

interface DocumentTreeProps {
  documents: Document[];
}

export function DocumentTree({ documents }: DocumentTreeProps) {
  const tree = useMemo(() => buildDocumentTree(documents), [documents]);

  const renderTreeNode = (node: TreeNode): JSX.Element | null => {
    // Defensive check: ensure node has required properties
    if (!node || !node.id || typeof node.name !== 'string') {
      console.error('Invalid tree node:', node);
      return null;
    }

    try {
      if (node.isFolder) {
        return <DocumentTreeFolder key={node.id} node={node} />;
      }
      return <DocumentTreeItem key={node.id} node={node} />;
    } catch (error) {
      console.error(
        `Error rendering tree node "${node.name}" (${node.id}):`,
        error
      );
      // Return a fallback item showing the error
      return (
        <div
          key={node.id}
          className="px-2 py-1 text-sm text-red-500"
          title={`Error rendering: ${error instanceof Error ? error.message : 'Unknown error'}`}
        >
          ⚠️ {node.name} (error)
        </div>
      );
    }
  };

  if (tree.length === 0) {
    return null;
  }

  return (
    <SidebarMenu>
      {tree.map(renderTreeNode).filter((node): node is JSX.Element => node !== null)}
    </SidebarMenu>
  );
}
