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

  const pathToNodeMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // Collect all unique folder paths from documents
  const folderPaths = new Set<string>();
  for (const doc of documents) {
    // If document is not at root, its path indicates a folder
    if (doc.path !== '/') {
      // Add the document's folder path
      folderPaths.add(doc.path);

      // Also add all parent folders
      // e.g., '/cooking/italian/' -> also add '/cooking/'
      let currentPath = doc.path;
      while (true) {
        const parentPath = getParentPath(currentPath);
        if (!parentPath || parentPath === '/') break;
        folderPaths.add(parentPath + '/'); // Ensure trailing slash
        currentPath = parentPath;
      }
    }
  }

  // Create folder nodes for all collected paths
  for (const folderPath of folderPaths) {
    // Generate a unique ID for the folder (use path as ID)
    const folderId = `folder:${folderPath}`;
    const folderName = folderPath.substring(folderPath.lastIndexOf('/', folderPath.length - 2) + 1, folderPath.length - 1);

    pathToNodeMap.set(folderPath, {
      id: folderId,
      name: folderName,
      path: folderPath,
      isFolder: true,
      children: [],
    });
  }

  // Create document nodes
  for (const doc of documents) {
    const node: TreeNode = {
      id: doc.id,
      name: doc.title, // Use document title as name
      path: doc.path,
      isFolder: false,
      document: doc,
      children: [],
    };

    // Add to path map only if not at root (to avoid conflicts)
    if (doc.path === '/') {
      rootNodes.push(node);
    } else {
      // Document will be added to its parent folder in next pass
      const parentFolder = pathToNodeMap.get(doc.path);
      if (parentFolder) {
        parentFolder.children.push(node);
      } else {
        // Fallback: if parent folder doesn't exist, add to root
        rootNodes.push(node);
      }
    }
  }

  // Build folder hierarchy
  for (const [folderPath, folderNode] of pathToNodeMap) {
    const parentPath = getParentPath(folderPath.replace(/\/$/, '')); // Remove trailing slash for parent calc

    if (parentPath === null || parentPath === '/') {
      // Top-level folder
      rootNodes.push(folderNode);
    } else {
      // Nested folder - add to parent
      const parentFolder = pathToNodeMap.get(parentPath + '/');
      if (parentFolder) {
        parentFolder.children.push(folderNode);
      } else {
        // Parent doesn't exist - add to root as fallback
        rootNodes.push(folderNode);
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
