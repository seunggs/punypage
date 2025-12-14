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
  // Handle empty content
  if (!content) {
    return `<document_title>${title}</document_title>\n\n<document_content>\n\n</document_content>`;
  }

  // Convert TipTap JSON to markdown using static renderer
  const markdown = renderToMarkdown({
    extensions: [StarterKit as any], // Use same extensions as editor
    content,
  });

  // Wrap in document tags with title and content separated
  return `<document_title>${title}</document_title>\n\n<document_content>\n${markdown}\n</document_content>`;
}
