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

  it('should nest documents inside folders using full path', () => {
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
        path: '/My Folder/Document in Folder', // ✅ Full path
        is_folder: false,
      }),
    ];

    const tree = buildDocumentTree(docs);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('My Folder');
    expect(tree[0].isFolder).toBe(true);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].name).toBe('Document in Folder');
    expect(tree[0].children[0].path).toBe('/My Folder/Document in Folder');
  });

  it('should handle multi-level nesting with full paths', () => {
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
        path: '/Data Engineering/Advanced', // ✅ Full path to folder
        is_folder: true,
      }),
      createMockDocument({
        id: 'doc-1',
        title: 'Step by Step',
        path: '/Data Engineering/Advanced/Step by Step', // ✅ Full path to document
        is_folder: false,
      }),
    ];

    const tree = buildDocumentTree(docs);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('Data Engineering');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].name).toBe('Advanced');
    expect(tree[0].children[0].isFolder).toBe(true);
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].name).toBe('Step by Step');
    expect(tree[0].children[0].children[0].path).toBe('/Data Engineering/Advanced/Step by Step');
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
        path: '/Parent/Document',
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

  it('should handle complex tree structure with full paths', () => {
    const docs: Document[] = [
      // Root documents
      createMockDocument({
        id: '1',
        title: 'Project Ideas',
        path: '/',
        is_folder: false,
      }),
      createMockDocument({
        id: '2',
        title: 'Courses',
        path: '/',
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
        path: '/AI/LLM',
        is_folder: false,
      }),
      createMockDocument({
        id: '7',
        title: 'AI App Building',
        path: '/AI/AI App Building',
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
        title: 'Playbook',
        path: '/Data Engineering/Playbook',
        is_folder: false,
      }),
      createMockDocument({
        id: '4',
        title: 'Pipeline',
        path: '/Data Engineering/Pipeline',
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
        title: 'Sidetrek',
        path: '/Data Engineering/Advanced/Sidetrek',
        is_folder: false,
      }),
    ];

    const tree = buildDocumentTree(docs);

    // Root level: 2 folders + 2 documents = 4 items
    expect(tree).toHaveLength(4);

    // Folders first
    expect(tree[0].isFolder).toBe(true);
    expect(tree[1].isFolder).toBe(true);
    expect(tree[2].isFolder).toBe(false);
    expect(tree[3].isFolder).toBe(false);

    // AI folder contents
    const aiFolder = tree.find(n => n.name === 'AI');
    expect(aiFolder?.children).toHaveLength(2);
    expect(aiFolder?.children[0].name).toBe('AI App Building');
    expect(aiFolder?.children[1].name).toBe('LLM');

    // Data Engineering folder contents (1 folder + 2 docs = 3)
    const deFolder = tree.find(n => n.name === 'Data Engineering');
    expect(deFolder?.children).toHaveLength(3);
    expect(deFolder?.children[0].isFolder).toBe(true); // Advanced folder first
    expect(deFolder?.children[0].name).toBe('Advanced');
    expect(deFolder?.children[1].name).toBe('Pipeline');
    expect(deFolder?.children[2].name).toBe('Playbook');

    // Advanced subfolder contents
    expect(deFolder?.children[0].children).toHaveLength(1);
    expect(deFolder?.children[0].children[0].name).toBe('Sidetrek');
    expect(deFolder?.children[0].children[0].path).toBe('/Data Engineering/Advanced/Sidetrek');
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

  it('should extract correct name from path', () => {
    const docs: Document[] = [
      createMockDocument({
        id: '1',
        title: 'AI', // title matches folder name
        path: '/AI',
        is_folder: true,
      }),
      createMockDocument({
        id: '2',
        title: 'LLM', // title matches document name
        path: '/AI/LLM',
        is_folder: false,
      }),
    ];

    const tree = buildDocumentTree(docs);
    expect(tree[0].name).toBe('AI');
    expect(tree[0].children[0].name).toBe('LLM');
  });
});
