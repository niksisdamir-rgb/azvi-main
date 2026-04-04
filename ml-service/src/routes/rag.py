from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..database import get_db
from ..services.document_service import DocumentService
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
import chromadb

router = APIRouter(prefix="/api/rag", tags=["rag"])

class DocumentRequest(BaseModel):
    title: str
    content: str
    source: str

class QueryRequest(BaseModel):
    query: str
    k: int = 3

@router.post("/documents")
async def create_document(request: DocumentRequest, db = Depends(get_db)):
    service = DocumentService(db)
    doc = service.create_document(request.title, request.content, request.source)
    return {"status": "success", "document": {
        "id": doc.id,
        "title": doc.title,
        "content": doc.content,
        "source": doc.source
    }}

@router.post("/query")
async def query_documents(request: QueryRequest, db = Depends(get_db)):
    service = DocumentService(db)

    # Initialize embeddings
    embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

    # Get all documents
    docs = service.get_all_documents()
    if not docs:
        return {"status": "success", "results": []}

    # Create vector store
    texts = [f"{doc.title}: {doc.content}" for doc in docs]
    metadatas = [{"id": doc.id, "source": doc.source} for doc in docs]

    vectorstore = Chroma.from_texts(texts, embeddings, metadatas=metadatas)

    # Perform similarity search
    results = vectorstore.similarity_search_with_score(request.query, k=request.k)

    response = []
    for doc, score in results:
        response.append({
            "content": doc.page_content,
            "metadata": doc.metadata,
            "score": float(score)
        })

    return {"status": "success", "results": response}