"""
Markdown parser and chunker for RAG indexing.
Parses markdown format, extracts text with heading context, and chunks for embedding.
"""
import tiktoken
import mistune
from typing import Any, TypedDict


class Chunk(TypedDict):
    """Represents a parsed chunk of content"""
    text: str
    section_heading: str | None
    chunk_index: int
    token_count: int


class MarkdownParser:
    """
    Parser for Markdown documents.

    Uses paragraph-level chunking where each paragraph becomes a separate chunk
    with heading context preserved for better semantic retrieval.
    """

    def __init__(self, encoding_name: str = "cl100k_base"):
        """
        Initialize parser.

        Args:
            encoding_name: Tiktoken encoding to use for token counting (default: cl100k_base)
        """
        self.encoder = tiktoken.get_encoding(encoding_name)
        self.markdown_parser = mistune.create_markdown(renderer='ast')

    def count_tokens(self, text: str) -> int:
        """Count tokens in text using tiktoken"""
        return len(self.encoder.encode(text))

    def extract_text_from_token(self, token: dict[str, Any]) -> str:
        """
        Recursively extract text from a markdown token.

        Args:
            token: Mistune AST token

        Returns:
            Extracted text content
        """
        token_type = token.get("type", "")

        # Text token - return raw text
        if token_type == "text":
            return token.get("raw", "")

        # For tokens with children, recursively extract
        if "children" in token and isinstance(token["children"], list):
            texts = [self.extract_text_from_token(child) for child in token["children"]]
            return " ".join(filter(None, texts))

        return ""

    def parse_tokens(self, markdown_text: str) -> list[dict[str, Any]]:
        """
        Parse markdown and extract structured tokens (paragraphs, headings, etc.)

        Args:
            markdown_text: Markdown document text

        Returns:
            List of parsed tokens with type, content, and heading level
        """
        nodes = []

        try:
            # Parse markdown to AST
            tokens = self.markdown_parser(markdown_text)

            if not isinstance(tokens, list):
                return nodes

            for token in tokens:
                token_type = token.get("type", "")

                if token_type == "heading":
                    level = token.get("attrs", {}).get("level", 1)
                    text = self.extract_text_from_token(token)
                    if text.strip():
                        nodes.append({
                            "type": "heading",
                            "level": level,
                            "text": text.strip()
                        })

                elif token_type == "paragraph":
                    text = self.extract_text_from_token(token)
                    if text.strip():
                        nodes.append({
                            "type": "paragraph",
                            "text": text.strip()
                        })

                elif token_type in ["list", "block_quote"]:
                    # Extract text from lists and blockquotes
                    text = self.extract_text_from_token(token)
                    if text.strip():
                        nodes.append({
                            "type": token_type,
                            "text": text.strip()
                        })

        except Exception as e:
            # Log error but return empty list rather than crashing
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error parsing markdown: {e}", exc_info=True)

        return nodes

    def chunk_nodes(self, nodes: list[dict[str, Any]]) -> list[Chunk]:
        """
        Chunk parsed nodes by paragraph.
        Each paragraph becomes a separate chunk with heading context.

        Args:
            nodes: List of parsed nodes from parse_tokens()

        Returns:
            List of chunks with text, heading context, and metadata
        """
        chunks: list[Chunk] = []
        current_heading: str | None = None
        chunk_index = 0

        for node in nodes:
            # Update heading context
            if node["type"] == "heading":
                # Update heading (use H2 and H3, ignore H1)
                if node.get("level") in [2, 3]:
                    current_heading = node["text"]
                continue

            # Each paragraph/list/blockquote becomes its own chunk
            text = node["text"]
            text_tokens = self.count_tokens(text)

            chunks.append({
                "text": text,
                "section_heading": current_heading,
                "chunk_index": chunk_index,
                "token_count": text_tokens
            })
            chunk_index += 1

        return chunks

    def parse_and_chunk(
        self,
        markdown_text: str,
        document_title: str
    ) -> list[Chunk]:
        """
        Parse markdown and chunk into optimized pieces for embedding.

        Args:
            markdown_text: Markdown document text
            document_title: Title of the document (for context)

        Returns:
            List of chunks ready for embedding
        """
        # Parse tokens from markdown
        tokens = self.parse_tokens(markdown_text)

        # Chunk tokens
        chunks = self.chunk_nodes(tokens)

        return chunks

    def create_embedding_text(
        self,
        chunk_text: str,
        document_title: str,
        section_heading: str | None = None
    ) -> str:
        """
        Create augmented text for embedding by prepending metadata.
        This improves search relevance by including context in the embedding.

        Args:
            chunk_text: The actual chunk content
            document_title: Title of the document
            section_heading: Section heading (if any)

        Returns:
            Augmented text ready for embedding
        """
        parts = [f"Document: {document_title}"]

        if section_heading:
            parts.append(f"Section: {section_heading}")

        parts.append("")  # Empty line separator
        parts.append(chunk_text)

        return "\n".join(parts)
