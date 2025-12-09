"""
Tiptap JSON parser and chunker for RAG indexing.
Parses Tiptap JSON format, extracts text with heading context, and chunks for embedding.
"""
import tiktoken
from typing import Any, TypedDict


class Chunk(TypedDict):
    """Represents a parsed chunk of content"""
    text: str
    section_heading: str | None
    chunk_index: int
    token_count: int


class TiptapParser:
    """Parser for Tiptap JSON documents"""

    def __init__(
        self,
        target_chunk_size: int = 600,
        min_chunk_size: int = 100,
        max_chunk_size: int = 1000,
        encoding_name: str = "cl100k_base"  # OpenAI's encoding for text-embedding-3-small
    ):
        """
        Initialize parser with chunking parameters.

        Args:
            target_chunk_size: Target token count per chunk (default: 600)
            min_chunk_size: Minimum tokens to create a chunk (default: 100)
            max_chunk_size: Maximum tokens per chunk (default: 1000)
            encoding_name: Tiktoken encoding to use for token counting
        """
        self.target_chunk_size = target_chunk_size
        self.min_chunk_size = min_chunk_size
        self.max_chunk_size = max_chunk_size
        self.encoder = tiktoken.get_encoding(encoding_name)

    def count_tokens(self, text: str) -> int:
        """Count tokens in text using tiktoken"""
        return len(self.encoder.encode(text))

    def extract_text_from_node(self, node: dict[str, Any]) -> str:
        """
        Recursively extract text from a Tiptap node.

        Args:
            node: Tiptap JSON node

        Returns:
            Extracted text content
        """
        node_type = node.get("type", "")

        # Text node - return the text directly
        if node_type == "text":
            return node.get("text", "")

        # For nodes with content array, recursively extract from children
        if "content" in node and isinstance(node["content"], list):
            texts = [self.extract_text_from_node(child) for child in node["content"]]

            # Join differently based on node type
            if node_type in ["paragraph", "heading", "blockquote"]:
                return " ".join(filter(None, texts))
            elif node_type in ["doc", "listItem", "bulletList", "orderedList"]:
                return " ".join(filter(None, texts))
            else:
                return " ".join(filter(None, texts))

        return ""

    def parse_nodes(self, tiptap_json: dict[str, Any]) -> list[dict[str, Any]]:
        """
        Parse Tiptap JSON and extract structured nodes (paragraphs, headings, etc.)

        Args:
            tiptap_json: Tiptap document JSON

        Returns:
            List of parsed nodes with type, content, and heading level
        """
        nodes = []

        if tiptap_json.get("type") != "doc":
            return nodes

        content = tiptap_json.get("content", [])

        for node in content:
            node_type = node.get("type", "")

            if node_type == "heading":
                level = node.get("attrs", {}).get("level", 1)
                text = self.extract_text_from_node(node)
                if text.strip():
                    nodes.append({
                        "type": "heading",
                        "level": level,
                        "text": text.strip()
                    })

            elif node_type == "paragraph":
                text = self.extract_text_from_node(node)
                if text.strip():
                    nodes.append({
                        "type": "paragraph",
                        "text": text.strip()
                    })

            elif node_type in ["bulletList", "orderedList", "blockquote"]:
                text = self.extract_text_from_node(node)
                if text.strip():
                    nodes.append({
                        "type": node_type,
                        "text": text.strip()
                    })

        return nodes

    def chunk_nodes(self, nodes: list[dict[str, Any]]) -> list[Chunk]:
        """
        Chunk parsed nodes by paragraph.
        Each paragraph becomes a separate chunk with heading context.

        Args:
            nodes: List of parsed nodes from parse_nodes()

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
                if node["level"] in [2, 3]:
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
        tiptap_json: dict[str, Any],
        document_title: str
    ) -> list[Chunk]:
        """
        Parse Tiptap JSON and chunk into optimized pieces for embedding.

        Args:
            tiptap_json: Tiptap document JSON
            document_title: Title of the document (for context)

        Returns:
            List of chunks ready for embedding
        """
        # Parse nodes from Tiptap JSON
        nodes = self.parse_nodes(tiptap_json)

        # Chunk nodes
        chunks = self.chunk_nodes(nodes)

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
