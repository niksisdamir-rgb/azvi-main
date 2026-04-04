from sqlalchemy.orm import Session
from ..models.document import Document
from typing import List

class DocumentService:
    def __init__(self, db: Session):
        self.db = db

    def create_document(self, title: str, content: str, source: str) -> Document:
        doc = Document(title=title, content=content, source=source)
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def get_document(self, doc_id: int) -> Document:
        return self.db.query(Document).filter(Document.id == doc_id).first()

    def get_all_documents(self) -> List[Document]:
        return self.db.query(Document).all()

    def search_documents(self, query: str) -> List[Document]:
        # Simple text search, can be enhanced with full-text search
        return self.db.query(Document).filter(Document.content.ilike(f'%{query}%')).all()