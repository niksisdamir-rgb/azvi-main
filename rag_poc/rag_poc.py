import os
from langchain_community.document_loaders import TextLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter

def main():
    print("Loading data...")
    loader = TextLoader("delivery_data.txt")
    docs = loader.load()

    print("Chunking data (Semantic Chunking approach fallback focusing on structure)...")
    # In a full production system, we'd use semantic chunking, but for a PoC
    # we'll use recursive character splitting to respect paragraphs and sentences.
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=200,
        chunk_overlap=50,
        separators=["\n\n", "\n", " ", ""]
    )
    splits = text_splitter.split_documents(docs)
    print(f"Created {len(splits)} chunks.")

    print("Initializing embedding model (HuggingFace)...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    print("Creating vector database with Chroma...")
    vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings, persist_directory="./chroma_db")

    print("Setting up retrieval...")
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 2})

    queries = [
        "What happens when delivery 104 is delayed?",
        "How is the quality score for concrete calculated?",
        "What are the criteria for a failed delivery?",
    ]

    for query in queries:
        print(f"\n--- Query: '{query}' ---")
        results = retriever.invoke(query)
        for i, res in enumerate(results):
            print(f"Result {i+1}:\n{res.page_content}\n")

if __name__ == "__main__":
    main()
