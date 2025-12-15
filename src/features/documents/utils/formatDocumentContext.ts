/**
 * Formats document context for chat by wrapping markdown in XML tags
 *
 * @param content - Markdown content from database
 * @param title - Document title
 * @returns Markdown wrapped in document_title and document_content tags
 */
export function formatDocumentContext(
  content: string | null | undefined,
  title: string
): string {
  if (!content) {
    return `<document_title>${title}</document_title>\n\n<document_content>\n\n</document_content>`;
  }

  return `<document_title>${title}</document_title>\n\n<document_content>\n${content}\n</document_content>`;
}
