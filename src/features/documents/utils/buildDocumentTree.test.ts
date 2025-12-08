import { describe, it, expect } from 'vitest';
import { buildDocumentTree } from './buildDocumentTree';
import type { Document } from '../types';

const createMockDocument = (
  overrides: Partial<Document> & Pick<Document, 'id' | 'title' | 'path' | 'is_folder'>
): Document => ({
  content: { type: 'doc', content: [] },
  user_id: 'test-user-id',
  status: 'draft',
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('buildDocumentTree', () => {
  it('should handle empty array', () => {
    const result = buildDocumentTree([]);
    expect(result).toEqual([]);
  });

  it('should handle single root document', () => {
    const docs: Document[] = [
      createMockDocument({
        id: '1',
        title: 'Root Doc',
        path: '/',
        is_folder: false,
      }),
    ];

    const tree = buildDocumentTree(docs);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({
      id: '1',
      name: 'Root Doc',
      path: '/',
      isFolder: false,
      children: [],
    });
    expect(tree[0].document).toBeDefined();
  });

  it('should handle multiple root documents', () => {
    const docs: Document[] = [
      createMockDocument({
        id: '1',
        title: 'Doc B',
        path: '/',
        is_folder: false,
      }),
      createMockDocument({
        id: '2',
        title: 'Doc A',
        path: '/',
        is_folder: false,
      }),
    ];

    const tree = buildDocumentTree(docs);
    expect(tree).toHaveLength(2);
    // Should be sorted alphabetically
    expect(tree[0].name).toBe('Doc A');
    expect(tree[1].name).toBe('Doc B');
  });

  it('should place folders before documents at root level', () => {
    const docs: Document[] = [
      createMockDocument({
        id: '1',
        title: 'Document',
        path: '/',
        is_folder: false,
      }),
      createMockDocument({
        id: '2',
        title: 'Folder',
        path: '/Folder',
        is_folder: true,
      }),
    ];

    const tree = buildDocumentTree(docs);
    expect(tree).toHaveLength(2);
    // Folders should come first
    expect(tree[0].isFolder).toBe(true);
    expect(tree[0].name).toBe('Folder');
    expect(tree[1].isFolder).toBe(false);
    expect(tree[1].name).toBe('Document');
  });

  it('should nest documents inside folders', () => {
    const docs: Document[] = [
      createMockDocument({
        id: 'folder-1',
        title: 'My Folder',
        path: '/My Folder',
        is_folder: true,
      }),
      createMockDocument({
        id: 'doc-1',
        title: 'Document in Folder',
        path: '/My Folder',
        is_folder: false,
      }),
    ];

    const tree = buildDocumentTree(docs);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('My Folder');
    expect(tree[0].isFolder).toBe(true);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].name).toBe('Document in Folder');
  });

  it('should handle multi-level nesting', () => {
    const docs: Document[] = [
      createMockDocument({
        id: 'folder-1',
        title: 'Data Engineering',
        path: '/Data Engineering',
        is_folder: true,
      }),
      createMockDocument({
        id: 'folder-2',
        title: 'Advanced',
        path: '/Data Engineering/Advanced',
        is_folder: true,
      }),
      createMockDocument({
        id: 'doc-1',
        title: 'Step by Step',
        path: '/Data Engineering/Advanced',
        is_folder: false,
      }),
    ];

    const tree = buildDocumentTree(docs);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('Data Engineering');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].name).toBe('Advanced');
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].name).toBe('Step by Step');
  });

  it('should sort folders before documents in nested levels', () => {
    const docs: Document[] = [
      createMockDocument({
        id: 'folder-1',
        title: 'Parent',
        path: '/Parent',
        is_folder: true,
      }),
      createMockDocument({
        id: 'doc-1',
        title: 'Document',
        path: '/Parent',
        is_folder: false,
      }),
      createMockDocument({
        id: 'folder-2',
        title: 'Child Folder',
        path: '/Parent/Child Folder',
        is_folder: true,
      }),
    ];

    const tree = buildDocumentTree(docs);
    expect(tree[0].children).toHaveLength(2);
    // Folder should come before document
    expect(tree[0].children[0].isFolder).toBe(true);
    expect(tree[0].children[0].name).toBe('Child Folder');
    expect(tree[0].children[1].isFolder).toBe(false);
    expect(tree[0].children[1].name).toBe('Document');
  });

  it('should handle complex tree structure matching seed data', () => {
    const docs: Document[] = [
      // Root documents
      createMockDocument({
        id: '1',
        title: 'Project Ideas (Immediate)',
        path: '/',
        is_folder: false,
      }),
      createMockDocument({
        id: '2',
        title: 'Courses',
        path: '/',
        is_folder: false,
      }),

      // Data Engineering folder and contents
      createMockDocument({
        id: 'de-folder',
        title: 'Data Engineering',
        path: '/Data Engineering',
        is_folder: true,
      }),
      createMockDocument({
        id: '3',
        title: 'Data Engineering Playbook',
        path: '/Data Engineering',
        is_folder: false,
      }),
      createMockDocument({
        id: '4',
        title: 'End-to-end Data Pipeline',
        path: '/Data Engineering',
        is_folder: false,
      }),

      // Nested Advanced folder
      createMockDocument({
        id: 'adv-folder',
        title: 'Advanced',
        path: '/Data Engineering/Advanced',
        is_folder: true,
      }),
      createMockDocument({
        id: '5',
        title: 'Step by Step Sidetrek',
        path: '/Data Engineering/Advanced',
        is_folder: false,
      }),

      // AI folder and contents
      createMockDocument({
        id: 'ai-folder',
        title: 'AI',
        path: '/AI',
        is_folder: true,
      }),
      createMockDocument({
        id: '6',
        title: 'LLM',
        path: '/AI',
        is_folder: false,
      }),
      createMockDocument({
        id: '7',
        title: 'AI App Building (Maven)',
        path: '/AI',
        is_folder: false,
      }),
    ];

    const tree = buildDocumentTree(docs);

    // Root level: 2 folders + 2 documents
    expect(tree).toHaveLength(4);

    // Folders first
    expect(tree[0].name).toBe('AI');
    expect(tree[0].isFolder).toBe(true);
    expect(tree[1].name).toBe('Data Engineering');
    expect(tree[1].isFolder).toBe(true);

    // Then documents (alphabetically)
    expect(tree[2].name).toBe('Courses');
    expect(tree[2].isFolder).toBe(false);
    expect(tree[3].name).toBe('Project Ideas (Immediate)');
    expect(tree[3].isFolder).toBe(false);

    // AI folder contents
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].name).toBe('AI App Building (Maven)');
    expect(tree[0].children[1].name).toBe('LLM');

    // Data Engineering folder contents (1 folder + 2 docs)
    expect(tree[1].children).toHaveLength(3);
    expect(tree[1].children[0].name).toBe('Advanced'); // folder first
    expect(tree[1].children[0].isFolder).toBe(true);
    expect(tree[1].children[1].name).toBe('Data Engineering Playbook');
    expect(tree[1].children[2].name).toBe('End-to-end Data Pipeline');

    // Advanced subfolder contents
    expect(tree[1].children[0].children).toHaveLength(1);
    expect(tree[1].children[0].children[0].name).toBe('Step by Step Sidetrek');
  });

  it('should not include folder document reference', () => {
    const docs: Document[] = [
      createMockDocument({
        id: 'folder-1',
        title: 'My Folder',
        path: '/My Folder',
        is_folder: true,
      }),
    ];

    const tree = buildDocumentTree(docs);
    expect(tree[0].document).toBeUndefined();
  });

  it('should include document reference for documents', () => {
    const docs: Document[] = [
      createMockDocument({
        id: 'doc-1',
        title: 'My Doc',
        path: '/',
        is_folder: false,
      }),
    ];

    const tree = buildDocumentTree(docs);
    expect(tree[0].document).toBeDefined();
    expect(tree[0].document?.id).toBe('doc-1');
  });

  it('should handle empty folders', () => {
    const docs: Document[] = [
      createMockDocument({
        id: 'folder-1',
        title: 'Empty Folder',
        path: '/Empty Folder',
        is_folder: true,
      }),
    ];

    const tree = buildDocumentTree(docs);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(0);
  });
});
