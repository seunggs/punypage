"""Pydantic schemas for MCP tool inputs and outputs"""
from pydantic import BaseModel, Field
from typing import Optional, Any


class CreateDocumentInput(BaseModel):
    """Input schema for create_document tool"""
    title: str = Field(..., description="Document title")
    content_md: str = Field(..., description="Document content in markdown format")
    path: str = Field(default="/", description="Document path in the tree structure")
    is_folder: bool = Field(default=False, description="Whether this is a folder or document")
    status: str = Field(default="draft", description="Document status: draft, published, or archived")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional metadata as JSON")


class UpdateDocumentInput(BaseModel):
    """Input schema for update_document tool"""
    id: str = Field(..., description="Document ID to update")
    title: Optional[str] = Field(None, description="New document title")
    content_md: Optional[str] = Field(None, description="New document content in markdown format")
    path: Optional[str] = Field(None, description="New document path")
    is_folder: Optional[bool] = Field(None, description="Whether this is a folder or document")
    status: Optional[str] = Field(None, description="New document status")
    metadata: Optional[dict[str, Any]] = Field(None, description="New metadata")


class ReadDocumentInput(BaseModel):
    """Input schema for read_document tool"""
    id: str = Field(..., description="Document ID to read")


class DeleteDocumentInput(BaseModel):
    """Input schema for delete_document tool"""
    id: str = Field(..., description="Document ID to delete")


class ListDocumentsInput(BaseModel):
    """Input schema for list_documents tool"""
    path: Optional[str] = Field(None, description="Filter by path (e.g., '/projects')")
    is_folder: Optional[bool] = Field(None, description="Filter by folder/document type")


class DocumentOutput(BaseModel):
    """Output schema for document operations"""
    id: str
    title: str
    content_md: str = Field(..., description="Document content in markdown format")
    path: str
    is_folder: bool
    user_id: str
    status: str
    metadata: dict[str, Any]
    created_at: str
    updated_at: str


class DocumentListItem(BaseModel):
    """Minimal document info for list operations"""
    id: str
    title: str
    path: str
    is_folder: bool
    status: str
    created_at: str
    updated_at: str


class DeleteDocumentOutput(BaseModel):
    """Output schema for delete_document tool"""
    success: bool
    deleted_id: str
