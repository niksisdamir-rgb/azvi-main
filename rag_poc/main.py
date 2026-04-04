import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_community.document_loaders import TextLoader, PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

app = FastAPI(title="Antigravity RAG Backend", description="Endpoints to ingest multi-format documents and semantic search over them.")

print("Initializing embedding model (all-MiniLM-L6-v2) ...")
model_name = "sentence-transformers/all-MiniLM-L6-v2"
model_kwargs = {'device': 'cpu'}
encode_kwargs = {'normalize_embeddings': False}

hf_embeddings = HuggingFaceEmbeddings(
    model_name=model_name,
    model_kwargs=model_kwargs,
    encode_kwargs=encode_kwargs
)

persist_directory = "./chroma_db"
os.makedirs(persist_directory, exist_ok=True)
print("Initializing Chroma vector store...")
vectorstore = Chroma(persist_directory=persist_directory, embedding_function=hf_embeddings)

print("Initializing Ollama LLM (deepseek-r1:1.5b)...")
llm = OllamaLLM(model="deepseek-r1:1.5b")

prompt_template = """Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.

Context:
{context}

Question: {question}

Helpful Answer:"""
PROMPT = PromptTemplate(
    template=prompt_template, input_variables=["context", "question"]
)

class QueryRequest(BaseModel):
    query: str
    user_id: int
    k: int = 2

class IngestRequest(BaseModel):
    user_id: int
    filename: Optional[str] = None

def load_documents_for_user(user_id: int, filename: Optional[str] = None):
    directory = f"documents/{user_id}"
    docs = []
    print(f"Scanning '{directory}' for documents...")
    if not os.path.exists(directory):
        print(f"Directory {directory} does not exist.")
        return docs
    
    if filename:
        file_path = os.path.join(directory, filename)
        if os.path.exists(file_path):
            files_to_process = [file_path]
        else:
            print(f"File {file_path} does not exist.")
            files_to_process = []
    else:
        files_to_process = []
        for root, _, files in os.walk(directory):
            for file in files:
                files_to_process.append(os.path.join(root, file))

    for file_path in files_to_process:
        try:
            if file_path.endswith(".txt"):
                print(f"Loading {file_path} as TXT...")
                docs.extend(TextLoader(file_path).load())
            elif file_path.endswith(".pdf"):
                print(f"Loading {file_path} as PDF...")
                docs.extend(PyPDFLoader(file_path).load())
            elif file_path.endswith(".docx"):
                print(f"Loading {file_path} as DOCX...")
                docs.extend(Docx2txtLoader(file_path).load())
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            
    for doc in docs:
        doc.metadata["user_id"] = user_id
        
    return docs

@app.post("/ingest")
def ingest_documents(request: IngestRequest):
    print(f"Ingest endpoint called for user {request.user_id}.")
    docs = load_documents_for_user(request.user_id, request.filename)
    if not docs:
        return {"message": "No documents found to ingest."}
    
    unique_sources = set(doc.metadata.get("source") for doc in docs if doc.metadata.get("source"))
    for source in unique_sources:
        try:
            # We filter by both source and user_id to safely remove old chunks
            existing = vectorstore.get(where={"$and": [{"source": source}, {"user_id": request.user_id}]})
            if existing and existing.get("ids"):
                print(f"Deleting {len(existing['ids'])} existing chunks for {source}...")
                vectorstore.delete(ids=existing["ids"])
        except Exception as e:
            print(f"Error checking/deleting {source}: {e}")
            
    print("Splitting documents...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=100,
        chunk_overlap=20,
        length_function=len,
        is_separator_regex=False,
    )
    chunks = text_splitter.split_documents(docs)
    
    print(f"Split into {len(chunks)} chunks, adding to vector store...")
    vectorstore.add_documents(chunks)
    
    return {"message": f"Successfully ingested and embedded {len(chunks)} chunks from {len(docs)} documents/pages."}

@app.post("/query")
def query_documents(request: QueryRequest):
    print(f"Query endpoint called with query: '{request.query}' for user {request.user_id}")
    if not request.query:
        raise HTTPException(status_code=400, detail="Query string cannot be empty")
    
    results = vectorstore.similarity_search(
        request.query, 
        k=request.k,
        filter={"user_id": request.user_id}
    )
    
    context_text = "\n\n".join([res.page_content for res in results])
    prompt = PROMPT.format(context=context_text, question=request.query)
    print("Invoking LLM...")
    answer = llm.invoke(prompt)
    
    return {
        "query": request.query,
        "answer": answer,
        "sources": [
            {
                "content": res.page_content,
                "metadata": res.metadata
            } for res in results
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
