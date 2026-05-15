import os
import json
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_community.retrievers import BM25Retriever
from dotenv import load_dotenv
import shutil
import asyncio
import time
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import tabula
import pandas as pd
from langchain_core.messages import HumanMessage

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="AskMyPDF Backend")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
VECTOR_DB_DIR = "faiss_index"
DOCS_METADATA_FILE = "docs_metadata.json"

# Create necessary directories
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
async def startup_event():
    """Run sync on startup."""
    sync_existing_files()

def load_docs_metadata():
    if os.path.exists(DOCS_METADATA_FILE):
        with open(DOCS_METADATA_FILE, "r") as f:
            return json.load(f)
    return {"documents": [], "collections": ["General"]}

def save_docs_metadata(metadata):
    with open(DOCS_METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=4)

def sync_existing_files():
    """
    Scans the UPLOAD_DIR for files not in metadata and adds them.
    Also ensures the vector store is built if it doesn't exist.
    """
    metadata = load_docs_metadata()
    existing_ids = {d["id"] for d in metadata["documents"]}
    files_in_dir = os.listdir(UPLOAD_DIR)
    
    updated = False
    new_chunks = []
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    current_time = time.strftime("%Y-%m-%d %H:%M:%S")

    for filename in files_in_dir:
        if not filename.endswith(".pdf"):
            continue
            
        if "_" in filename:
            parts = filename.split("_", 1)
            doc_id = parts[0]
            original_name = parts[1]
        else:
            doc_id = str(uuid.uuid4())
            original_name = filename
            new_filename = f"{doc_id}_{filename}"
            os.rename(os.path.join(UPLOAD_DIR, filename), os.path.join(UPLOAD_DIR, new_filename))
            filename = new_filename

        if doc_id not in existing_ids:
            print(f"Syncing new file: {original_name}")
            try:
                file_path = os.path.join(UPLOAD_DIR, filename)
                documents = extract_advanced_content(file_path)
                
                for doc in documents:
                    doc.metadata.update({
                        "doc_id": doc_id,
                        "source_file": original_name,
                        "upload_timestamp": current_time,
                        "collection": "General"
                    })
                
                chunks = text_splitter.split_documents(documents)
                new_chunks.extend(chunks)
                
                metadata["documents"].append({
                    "id": doc_id,
                    "name": original_name,
                    "collection": "General",
                    "upload_time": current_time,
                    "chunk_count": len(chunks)
                })
                updated = True
            except Exception as e:
                print(f"Failed to sync {filename}: {e}")

    if updated:
        save_docs_metadata(metadata)
        global vector_store, bm25_retriever, all_chunks
        
        if os.path.exists(VECTOR_DB_DIR):
            if vector_store is None:
                vector_store = FAISS.load_local(VECTOR_DB_DIR, embeddings, allow_dangerous_deserialization=True)
            if new_chunks:
                vector_store.add_documents(new_chunks)
        else:
            if new_chunks:
                vector_store = FAISS.from_documents(new_chunks, embeddings)
        
        if vector_store:
            vector_store.save_local(VECTOR_DB_DIR)
        
        # Rebuild BM25 for hybrid search
        all_docs = []
        for d in metadata["documents"]:
            d_path = os.path.join(UPLOAD_DIR, f"{d['id']}_{d['name']}")
            if os.path.exists(d_path):
                docs = extract_advanced_content(d_path)
                all_docs.extend(text_splitter.split_documents(docs))
        
        all_chunks = all_docs
        if all_chunks:
            bm25_retriever = BM25Retriever.from_documents(all_chunks)
            bm25_retriever.k = 3
        print("Sync complete.")

def extract_advanced_content(file_path):
    """
    Phase 6: Advanced Extraction
    1. Standard PDF Text
    2. OCR for scanned pages/images
    3. Table extraction
    """
    all_content = []
    
    # 1. Standard Extraction
    try:
        loader = PyPDFLoader(file_path)
        standard_docs = loader.load()
        if any(doc.page_content.strip() for doc in standard_docs):
            all_content.extend(standard_docs)
            print(f"Standard extraction successful for {file_path}")
    except Exception as e:
        print(f"Standard extraction failed: {e}")

    # 2. OCR Fallback (if standard extraction yielded very little text)
    total_text = "".join(doc.page_content for doc in all_content)
    if len(total_text.strip()) < 100: # Threshold for "scanned" PDF
        print(f"Low text detected ({len(total_text)} chars). Running OCR...")
        try:
            images = convert_from_path(file_path)
            for i, image in enumerate(images):
                ocr_text = pytesseract.image_to_string(image)
                from langchain_core.documents import Document
                all_content.append(Document(
                    page_content=ocr_text,
                    metadata={"page": i, "source": file_path, "type": "ocr"}
                ))
        except Exception as e:
            print(f"OCR failed: {e}. Ensure Tesseract and poppler are installed.")

    # 3. Table Extraction
    try:
        print(f"Extracting tables from {file_path}...")
        tables = tabula.read_pdf(file_path, pages='all', multiple_tables=True)
        for i, df in enumerate(tables):
            if not df.empty:
                table_text = f"Table Data:\n{df.to_markdown(index=False)}"
                from langchain_core.documents import Document
                all_content.append(Document(
                    page_content=table_text,
                    metadata={"page": "unknown", "source": file_path, "type": "table"}
                ))
    except Exception as e:
        print(f"Table extraction failed: {e}")

    return all_content

# Initialize embeddings using Google Generative AI
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# Global variables to store the vector store and BM25 retriever
vector_store = None
bm25_retriever = None
all_chunks = []

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), collection: str = Form("General")):
    """
    Step 2 & 3: Upload PDF, Extract Text, and Add to Global Vector Store
    Supports Multi-PDF Intelligence and Collections.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    doc_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Step 3: Extract PDF Text
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        # Add enhanced metadata to documents
        current_time = time.strftime("%Y-%m-%d %H:%M:%S")
        for i, doc in enumerate(documents):
            doc.metadata.update({
                "doc_id": doc_id,
                "source_file": file.filename,
                "upload_timestamp": current_time,
                "collection": collection,
                "section": f"Page {doc.metadata.get('page', i) + 1}"
            })
        
        # Step 4: Chunking
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = text_splitter.split_documents(documents)
        
        # Step 5 & 6: Update Global FAISS Index
        global vector_store, bm25_retriever, all_chunks
        
        if os.path.exists(VECTOR_DB_DIR):
            if vector_store is None:
                vector_store = FAISS.load_local(VECTOR_DB_DIR, embeddings, allow_dangerous_deserialization=True)
            vector_store.add_documents(chunks)
        else:
            vector_store = FAISS.from_documents(chunks, embeddings)
        
        vector_store.save_local(VECTOR_DB_DIR)
        
        # Update Metadata tracking
        metadata = load_docs_metadata()
        metadata["documents"].append({
            "id": doc_id,
            "name": file.filename,
            "collection": collection,
            "upload_time": current_time,
            "chunk_count": len(chunks)
        })
        if collection not in metadata["collections"]:
            metadata["collections"].append(collection)
        save_docs_metadata(metadata)
        
        # Re-initialize all_chunks and BM25 for Hybrid Search across ALL docs
        # Note: In a large system, we'd use a more efficient way to update BM25
        all_docs = []
        for d in metadata["documents"]:
            # Re-load or cache chunks? For Phase 4 MVP, we'll re-load the processed chunks from FAISS 
            # or just re-process the files. Re-processing is safer for BM25 consistency.
            d_path = os.path.join(UPLOAD_DIR, f"{d['id']}_{d['name']}")
            if os.path.exists(d_path):
                l = PyPDFLoader(d_path)
                docs = l.load()
                all_docs.extend(text_splitter.split_documents(docs))
        
        all_chunks = all_docs
        bm25_retriever = BM25Retriever.from_documents(all_chunks)
        bm25_retriever.k = 3
        
        return {
            "message": f"File '{file.filename}' added to collection '{collection}'",
            "doc_id": doc_id,
            "chunks_created": len(chunks),
            "filename": file.filename,
            "url": f"http://localhost:8000/uploads/{doc_id}_{file.filename}"
        }
    except Exception as e:
        print(f"Error during upload/processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
async def get_documents():
    """List all uploaded documents and collections."""
    return load_docs_metadata()

@app.post("/chat")
async def chat(payload: dict):
    """
    Step 7: Chat Endpoint with Hybrid Search and Smart Citations
    """
    global vector_store, bm25_retriever, all_chunks
    
    question = payload.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    
    # Load retrievers if not in memory
    if vector_store is None:
        if os.path.exists(VECTOR_DB_DIR):
            try:
                vector_store = FAISS.load_local(
                    VECTOR_DB_DIR, 
                    embeddings, 
                    allow_dangerous_deserialization=True
                )
                
                # Load metadata and rebuild BM25 for hybrid search
                metadata = load_docs_metadata()
                all_docs = []
                text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
                
                for d in metadata["documents"]:
                    d_path = os.path.join(UPLOAD_DIR, f"{d['id']}_{d['name']}")
                    if os.path.exists(d_path):
                        l = PyPDFLoader(d_path)
                        docs = l.load()
                        all_docs.extend(text_splitter.split_documents(docs))
                
                all_chunks = all_docs
                if all_chunks:
                    bm25_retriever = BM25Retriever.from_documents(all_chunks)
                    bm25_retriever.k = 3
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to load retrievers: {e}")
        else:
            raise HTTPException(status_code=400, detail="No PDF processed yet. Please upload a PDF first.")
    
    try:
        if not os.getenv("GEMINI_API_KEY"):
             return {"answer": "Error: GEMINI_API_KEY not found in environment variables."}

        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash", 
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0,
            streaming=True
        )
        
        template = """Answer the question based ONLY on the following context. 
        If the context contains information from multiple documents, synthesize the answer.
        If you don't know the answer based on the context, just say you don't know.
        
        Context:
        {context}

        Question: {question}
        """
        prompt = ChatPromptTemplate.from_template(template)
        
        # Setup Hybrid Search (Manual Ensemble)
        collection_filter = payload.get("collection")
        
        # 1. Semantic Search (FAISS)
        if collection_filter:
            faiss_docs = vector_store.similarity_search(
                question, 
                k=5, 
                filter={"collection": collection_filter}
            )
        else:
            faiss_docs = vector_store.similarity_search(question, k=5)
            
        # 2. Keyword Search (BM25)
        bm25_docs = []
        if bm25_retriever:
            # Filter all_chunks for BM25 manually if needed
            if collection_filter:
                filtered_chunks = [c for c in all_chunks if c.metadata.get("collection") == collection_filter]
                if filtered_chunks:
                    temp_bm25 = BM25Retriever.from_documents(filtered_chunks)
                    bm25_docs = temp_bm25.invoke(question)
            else:
                bm25_docs = bm25_retriever.invoke(question)
        
        # Combine and deduplicate
        combined_docs = faiss_docs + bm25_docs
        # Deduplicate based on content (simple version)
        seen_content = set()
        docs = []
        for doc in combined_docs:
            if doc.page_content not in seen_content:
                docs.append(doc)
                seen_content.add(doc.page_content)
        
        docs = docs[:6] # Limit to top 6
        
        context_text = "\n\n".join(doc.page_content for doc in docs)
        
        # Smart Citations: Page + Section + Document Name
        sources = []
        for doc in docs:
            sources.append({
                "content": doc.page_content[:200] + "...",
                "metadata": {
                    "page": doc.metadata.get("page", 0),
                    "source": doc.metadata.get("source_file", "Unknown"),
                    "section": doc.metadata.get("section", "N/A"),
                    "timestamp": doc.metadata.get("upload_timestamp", "N/A")
                }
            })

        async def generate_stream():
            yield f"__SOURCES__:{json.dumps(sources)}\n"
            chain = prompt | llm | StrOutputParser()
            async for chunk in chain.astream({"context": context_text, "question": question}):
                yield chunk

        return StreamingResponse(generate_stream(), media_type="text/plain")
        
    except Exception as e:
        print(f"Error during chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document and its vectors."""
    metadata = load_docs_metadata()
    doc_to_delete = next((d for d in metadata["documents"] if d["id"] == doc_id), None)
    
    if not doc_to_delete:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove file
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{doc_to_delete['name']}")
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Update metadata
    metadata["documents"] = [d for d in metadata["documents"] if d["id"] != doc_id]
    save_docs_metadata(metadata)
    
    # Rebuild Vector Store (FAISS doesn't support easy individual deletes without IDs)
    # For Phase 4, we'll rebuild the global index from remaining files
    global vector_store, bm25_retriever, all_chunks
    
    all_docs = []
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    
    for d in metadata["documents"]:
        d_path = os.path.join(UPLOAD_DIR, f"{d['id']}_{d['name']}")
        if os.path.exists(d_path):
            l = PyPDFLoader(d_path)
            docs = l.load()
            all_docs.extend(text_splitter.split_documents(docs))
            
    if all_docs:
        vector_store = FAISS.from_documents(all_docs, embeddings)
        vector_store.save_local(VECTOR_DB_DIR)
        all_chunks = all_docs
        bm25_retriever = BM25Retriever.from_documents(all_chunks)
    else:
        # If no docs left, clear everything
        if os.path.exists(VECTOR_DB_DIR):
            shutil.rmtree(VECTOR_DB_DIR)
        vector_store = None
        all_chunks = []
        bm25_retriever = None

    return {"message": "Document deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
