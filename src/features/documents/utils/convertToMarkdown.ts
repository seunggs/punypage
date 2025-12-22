import { renderToMarkdown } from '@tiptap/static-renderer/pm/markdown';
import StarterKit from '@tiptap/starter-kit';
import type { JSONContent } from '@tiptap/core';

/**
 * Converts TipTap JSON content to Markdown format wrapped in document tags
 *
 * @param content - TipTap JSONContent from the editor
 * @param title - Document title
 * @returns Formatted string with document_title and document_content tags
 */
export function convertToMarkdown(
  content: JSONContent | null | undefined,
  title: string
): string {
  // Handle empty or invalid content
  if (!content || typeof content !== 'object' || Object.keys(content).length === 0) {
    return `<document_title>${title}</document_title>\n\n<document_content>\n\n</document_content>`;
  }

  try {
    // Convert TipTap JSON to markdown using static renderer
    const markdown = renderToMarkdown({
      extensions: [StarterKit as any], // Use same extensions as editor
      content,
    });

    // Wrap in document tags with title and content separated
    return `<document_title>${title}</document_title>\n\n<document_content>\n${markdown}\n</document_content>`;
  } catch (error) {
    console.error('Failed to convert document to markdown:', error, 'Content:', content);
    // Return title only if conversion fails
    return `<document_title>${title}</document_title>\n\n<document_content>\n[Error converting document content]\n</document_content>`;
  }
}
