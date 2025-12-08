import type { Document } from '../types';

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  document?: Document;
  children: TreeNode[];
}

export function buildDocumentTree(documents: Document[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // Sort documents: folders first, then alphabetically by title
  const sortedDocs = [...documents].sort((a, b) => {
    if (a.is_folder !== b.is_folder) {
      return a.is_folder ? -1 : 1;
    }
    return a.title.localeCompare(b.title);
  });

  // First pass: create nodes for all documents
  for (const doc of sortedDocs) {
    const node: TreeNode = {
      id: doc.id,
      name: doc.title,
      path: doc.path,
      isFolder: doc.is_folder,
      document: doc.is_folder ? undefined : doc,
      children: [],
    };
    nodeMap.set(doc.id, node);
  }

  // Second pass: build hierarchy
  for (const doc of sortedDocs) {
    const node = nodeMap.get(doc.id)!;

    if (doc.path === '/') {
      // Root level document
      rootNodes.push(node);
    } else {
      // Find parent folder
      const parentPath = doc.path;
      const parentFolder = sortedDocs.find(
        (d) => d.path === parentPath && d.is_folder
      );

      if (parentFolder) {
        const parentNode = nodeMap.get(parentFolder.id);
        if (parentNode && !doc.is_folder) {
          // Only add if it's a document (not a folder)
          parentNode.children.push(node);
        }
      }

      // If this is a folder, find its parent
      if (doc.is_folder) {
        const pathParts = doc.path.split('/').filter(Boolean);
        if (pathParts.length === 1) {
          // Level 1 folder
          rootNodes.push(node);
        } else {
          // Nested folder - find parent folder
          const parentPathStr = '/' + pathParts.slice(0, -1).join('/');
          const parentFolder = sortedDocs.find(
            (d) => d.path === parentPathStr && d.is_folder
          );
          if (parentFolder) {
            const parentNode = nodeMap.get(parentFolder.id);
            if (parentNode) {
              parentNode.children.push(node);
            }
          }
        }
      }
    }
  }

  // Sort children recursively
  const sortChildren = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const sortTreeRecursively = (nodes: TreeNode[]): void => {
    for (const node of nodes) {
      if (node.children.length > 0) {
        node.children = sortChildren(node.children);
        sortTreeRecursively(node.children);
      }
    }
  };

  const sortedRootNodes = sortChildren(rootNodes);
  sortTreeRecursively(sortedRootNodes);

  return sortedRootNodes;
}
