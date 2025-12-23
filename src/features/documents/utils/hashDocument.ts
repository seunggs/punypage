/**
 * Creates a simple hash of document content and title for change detection
 * Uses DJB2 hash algorithm which is fast and sufficient for detecting changes
 *
 * @param content - Markdown content from the database
 * @param title - Document title
 * @returns Hash string representing the document state
 */
export function hashDocument(
  content: string | null | undefined,
  title: string
): string {
  const payload = JSON.stringify({ content, title });

  // DJB2 hash algorithm - fast and effective for our use case
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = ((hash << 5) + hash) + payload.charCodeAt(i);
    hash = hash | 0; // Convert to 32bit integer
  }

  return hash.toString();
}
