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

  const renderTreeNode = (node: TreeNode): JSX.Element => {
    if (node.isFolder) {
      return <DocumentTreeFolder key={node.id} node={node} />;
    }
    return <DocumentTreeItem key={node.id} node={node} />;
  };

  if (tree.length === 0) {
    return null;
  }

  return <SidebarMenu>{tree.map(renderTreeNode)}</SidebarMenu>;
}
