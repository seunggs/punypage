/**
 * Formats document context for chat by wrapping markdown in XML tags
 *
 * @param documentId - Document ID from database
 * @param content - Markdown content from database
 * @param title - Document title
 * @returns Markdown wrapped in document_id, document_title and document_content tags
 */
export function formatDocumentContext(
  documentId: string,
  content: string | null | undefined,
  title: string
): string {
  if (!content) {
    return `<document_id>${documentId}</document_id>\n<document_title>${title}</document_title>\n\n<document_content>\n\n</document_content>`;
  }

  return `<document_id>${documentId}</document_id>\n<document_title>${title}</document_title>\n\n<document_content>\n${content}\n</document_content>`;
}
