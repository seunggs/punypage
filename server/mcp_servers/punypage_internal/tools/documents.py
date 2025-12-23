"""Document CRUD tool implementations"""
import logging
from typing import Any
from .schemas import (
    CreateDocumentInput,
    UpdateDocumentInput,
    ReadDocumentInput,
    DeleteDocumentInput,
    ListDocumentsInput,
    DocumentOutput,
    DocumentListItem,
    DeleteDocumentOutput,
)
from ..db.supabase import get_supabase_client, get_user_id

logger = logging.getLogger(__name__)


async def create_document(input_data: CreateDocumentInput) -> DocumentOutput:
    """
    Create a new document.

    Args:
        input_data: Document creation parameters

    Returns:
        Created document with all fields

    Raises:
        Exception: If document creation fails
    """
    client = get_supabase_client()
    user_id = get_user_id()

    try:
        # Insert document into Supabase
        result = client.table('documents').insert({
            'title': input_data.title,
            'content': input_data.content_md,  # Store markdown as TEXT
            'path': input_data.path,
            'is_folder': input_data.is_folder,
            'user_id': user_id,
            'status': input_data.status,
            'metadata': input_data.metadata,
        }).execute()

        if not result.data:
            raise Exception("Failed to create document: no data returned")

        doc = result.data[0]
        logger.info(f"Created document: {doc['id']} - {doc['title']}")

        return DocumentOutput(
            id=doc['id'],
            title=doc['title'],
            content_md=doc['content'],  # Return markdown
            path=doc['path'],
            is_folder=doc['is_folder'],
            user_id=doc['user_id'],
            status=doc['status'],
            metadata=doc['metadata'] or {},
            created_at=doc['created_at'],
            updated_at=doc['updated_at'],
        )

    except Exception as e:
        logger.error(f"Failed to create document: {e}", exc_info=True)
        raise Exception(f"Failed to create document: {str(e)}")


async def update_document(input_data: UpdateDocumentInput) -> DocumentOutput:
    """
    Update an existing document.

    Args:
        input_data: Document update parameters

    Returns:
        Updated document with all fields

    Raises:
        Exception: If document update fails or not found
    """
    client = get_supabase_client()
    user_id = get_user_id()

    try:
        # Build update payload (only include provided fields)
        update_data: dict[str, Any] = {}
        if input_data.title is not None:
            update_data['title'] = input_data.title
        if input_data.content_md is not None:
            update_data['content'] = input_data.content_md
        if input_data.path is not None:
            update_data['path'] = input_data.path
        if input_data.is_folder is not None:
            update_data['is_folder'] = input_data.is_folder
        if input_data.status is not None:
            update_data['status'] = input_data.status
        if input_data.metadata is not None:
            update_data['metadata'] = input_data.metadata

        if not update_data:
            raise Exception("No fields provided for update")

        # Update document (RLS will ensure user owns it)
        result = client.table('documents').update(update_data).eq('id', input_data.id).eq('user_id', user_id).execute()

        if not result.data:
            raise Exception(f"Document not found or unauthorized: {input_data.id}")

        doc = result.data[0]
        logger.info(f"Updated document: {doc['id']} - {doc['title']}")

        return DocumentOutput(
            id=doc['id'],
            title=doc['title'],
            content_md=doc['content'],
            path=doc['path'],
            is_folder=doc['is_folder'],
            user_id=doc['user_id'],
            status=doc['status'],
            metadata=doc['metadata'] or {},
            created_at=doc['created_at'],
            updated_at=doc['updated_at'],
        )

    except Exception as e:
        logger.error(f"Failed to update document: {e}", exc_info=True)
        raise Exception(f"Failed to update document: {str(e)}")


async def read_document(input_data: ReadDocumentInput) -> DocumentOutput:
    """
    Read a document by ID.

    Args:
        input_data: Document ID to read

    Returns:
        Document with all fields

    Raises:
        Exception: If document not found or unauthorized
    """
    client = get_supabase_client()
    user_id = get_user_id()

    try:
        # Read document (RLS will ensure user owns it)
        result = client.table('documents').select('*').eq('id', input_data.id).eq('user_id', user_id).execute()

        if not result.data:
            raise Exception(f"Document not found or unauthorized: {input_data.id}")

        doc = result.data[0]
        logger.info(f"Read document: {doc['id']} - {doc['title']}")

        return DocumentOutput(
            id=doc['id'],
            title=doc['title'],
            content_md=doc['content'],
            path=doc['path'],
            is_folder=doc['is_folder'],
            user_id=doc['user_id'],
            status=doc['status'],
            metadata=doc['metadata'] or {},
            created_at=doc['created_at'],
            updated_at=doc['updated_at'],
        )

    except Exception as e:
        logger.error(f"Failed to read document: {e}", exc_info=True)
        raise Exception(f"Failed to read document: {str(e)}")


async def delete_document(input_data: DeleteDocumentInput) -> DeleteDocumentOutput:
    """
    Delete a document by ID.

    Args:
        input_data: Document ID to delete

    Returns:
        Deletion confirmation

    Raises:
        Exception: If document deletion fails or not found
    """
    client = get_supabase_client()
    user_id = get_user_id()

    try:
        # Delete document (RLS will ensure user owns it)
        result = client.table('documents').delete().eq('id', input_data.id).eq('user_id', user_id).execute()

        if not result.data:
            raise Exception(f"Document not found or unauthorized: {input_data.id}")

        logger.info(f"Deleted document: {input_data.id}")

        return DeleteDocumentOutput(
            success=True,
            deleted_id=input_data.id,
        )

    except Exception as e:
        logger.error(f"Failed to delete document: {e}", exc_info=True)
        raise Exception(f"Failed to delete document: {str(e)}")


async def list_documents(input_data: ListDocumentsInput) -> list[DocumentListItem]:
    """
    List documents with optional filters.

    Args:
        input_data: List filters (path, is_folder)

    Returns:
        List of documents (minimal info)

    Raises:
        Exception: If listing fails
    """
    client = get_supabase_client()
    user_id = get_user_id()

    try:
        # Build query
        query = client.table('documents').select('id, title, path, is_folder, status, created_at, updated_at').eq('user_id', user_id)

        # Apply filters
        if input_data.path is not None:
            query = query.eq('path', input_data.path)
        if input_data.is_folder is not None:
            query = query.eq('is_folder', input_data.is_folder)

        # Execute query
        result = query.order('created_at', desc=True).execute()

        logger.info(f"Listed {len(result.data)} documents")

        return [
            DocumentListItem(
                id=doc['id'],
                title=doc['title'],
                path=doc['path'],
                is_folder=doc['is_folder'],
                status=doc['status'],
                created_at=doc['created_at'],
                updated_at=doc['updated_at'],
            )
            for doc in result.data
        ]

    except Exception as e:
        logger.error(f"Failed to list documents: {e}", exc_info=True)
        raise Exception(f"Failed to list documents: {str(e)}")
