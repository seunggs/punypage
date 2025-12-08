import type { Document } from '../types';

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  document?: Document;
  children: TreeNode[];
}

/**
 * Extracts the parent path from a full path
 * Examples:
 *   "/" -> null (root has no parent)
 *   "/AI" -> "/"
 *   "/AI/LLM" -> "/AI"
 *   "/Data Engineering/Advanced/Topic" -> "/Data Engineering/Advanced"
 */
function getParentPath(path: string): string | null {
  if (path === '/') return null;

  const lastSlashIndex = path.lastIndexOf('/');
  if (lastSlashIndex === 0) {
    // Path like "/AI" -> parent is "/"
    return '/';
  }

  // Path like "/AI/LLM" -> parent is "/AI"
  return path.substring(0, lastSlashIndex);
}

/**
 * Extracts the name from a full path
 * Examples:
 *   "/" -> "" (special case for root)
 *   "/AI" -> "AI"
 *   "/AI/LLM" -> "LLM"
 *   "/Data Engineering/Advanced" -> "Advanced"
 */
function getNameFromPath(path: string, title: string): string {
  if (path === '/') return title;

  const lastSlashIndex = path.lastIndexOf('/');
  return path.substring(lastSlashIndex + 1);
}

export function buildDocumentTree(documents: Document[]): TreeNode[] {
  if (documents.length === 0) return [];

  const nodeMap = new Map<string, TreeNode>();
  const pathToNodeMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // First pass: create all nodes
  for (const doc of documents) {
    const node: TreeNode = {
      id: doc.id,
      name: getNameFromPath(doc.path, doc.title),
      path: doc.path,
      isFolder: doc.is_folder,
      document: doc.is_folder ? undefined : doc,
      children: [],
    };

    nodeMap.set(doc.id, node);
    pathToNodeMap.set(doc.path, node);
  }

  // Second pass: build hierarchy
  for (const doc of documents) {
    const node = nodeMap.get(doc.id)!;
    const parentPath = getParentPath(doc.path);

    if (parentPath === null || parentPath === '/') {
      // Root level item (either path is "/" or parent is "/")
      rootNodes.push(node);
    } else {
      // Find parent by path (parent must be a folder, not root)
      const parentNode = pathToNodeMap.get(parentPath);
      if (parentNode && parentNode.isFolder) {
        parentNode.children.push(node);
      } else {
        // Parent doesn't exist or isn't a folder - treat as root level
        // This handles orphaned items gracefully but may indicate data integrity issues
        console.warn(
          `Document "${doc.title}" (${doc.id}) has orphaned path "${doc.path}". ` +
            `Parent path "${parentPath}" ${
              parentNode
                ? 'exists but is not a folder'
                : 'does not exist'
            }. ` +
            'Document will be shown at root level.'
        );
        rootNodes.push(node);
      }
    }
  }

  // Sort function: folders first, then alphabetically
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      // Folders come first
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  };

  // Recursively sort all levels
  const sortTreeRecursively = (nodes: TreeNode[]): void => {
    sortNodes(nodes);
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortTreeRecursively(node.children);
      }
    }
  };

  sortTreeRecursively(rootNodes);

  return rootNodes;
}
