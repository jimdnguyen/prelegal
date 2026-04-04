from fastapi import APIRouter, HTTPException

from documents import get_doc_by_name, get_template_content, load_catalog

router = APIRouter()


@router.get("/catalog")
def get_catalog():
    """Return the list of all supported document types."""
    return load_catalog()


@router.get("/templates/{document_type:path}")
def get_template(document_type: str):
    """Return the raw template content for a document type."""
    doc = get_doc_by_name(document_type)
    if not doc:
        raise HTTPException(status_code=404, detail="Document type not found")
    content = get_template_content(doc["filename"])
    return {"content": content, "filename": doc["filename"]}
