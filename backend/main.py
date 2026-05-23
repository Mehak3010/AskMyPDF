import os
import json
import uuid
import shutil
import time

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Form,
)

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from fastapi.responses import (
    StreamingResponse,
)

from fastapi.staticfiles import (
    StaticFiles,
)

from dotenv import load_dotenv

# =========================
# LANGCHAIN
# =========================

from langchain_community.document_loaders import (
    PyPDFLoader,
)

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
)

from langchain_google_genai import (
    GoogleGenerativeAIEmbeddings,
    ChatGoogleGenerativeAI,
)

try:
    from langchain_huggingface import (
        HuggingFaceEmbeddings,
    )
except ImportError:
    print("WARNING: langchain_huggingface not found. Local fallback will use langchain_community.")
    from langchain_community.embeddings import (
        HuggingFaceEmbeddings,
    )

from langchain_community.vectorstores import (
    FAISS,
)

from langchain_core.prompts import (
    ChatPromptTemplate,
)

from langchain_core.output_parsers import (
    StrOutputParser,
)

from langchain_community.retrievers import (
    BM25Retriever,
)

from langchain_core.documents import (
    Document,
)

# =========================
# LOAD ENV
# =========================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("CRITICAL ERROR: GEMINI_API_KEY not found in environment variables.")
else:
    print(f"Gemini API Key loaded: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-5:]}")

# =========================
# APP CONFIG
# =========================

app = FastAPI(
    title="AskMyPDF Backend"
)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# PATHS
# =========================

UPLOAD_DIR = "uploads"

VECTOR_DB_DIR = "faiss_index"

DOCS_METADATA_FILE = (
    "docs_metadata.json"
)

CACHE_DIR = "processed_chunks"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)

os.makedirs(
    CACHE_DIR,
    exist_ok=True
)

# =========================
# GLOBALS
# =========================

vector_store = None

bm25_retriever = None

all_chunks = []

# =========================
# EMBEDDINGS
# =========================

try:
    # TRY GEMINI EMBEDDINGS
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=GEMINI_API_KEY,
        task_type="retrieval_document"
    )
    # TEST IF IT WORKS
    embeddings.embed_query("test")
    print("Embeddings initialized: Gemini (text-embedding-004)")
except Exception as e:
    print(f"Gemini Embeddings failed: {e}")
    print("Falling back to local HuggingFace embeddings (all-MiniLM-L6-v2)...")
    try:
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    except Exception as hf_err:
        print(f"Local embeddings failed: {hf_err}")
        print("CRITICAL: No embedding model available. RAG will not work.")
        embeddings = None
    print("Embeddings initialized: Local HuggingFace")

# =========================
# METADATA HELPERS
# =========================


def get_mode_prompt(mode):

    prompts = {

        "Beginner": """
Explain simply.

Use easy language.

Teach step-by-step.

Use analogies.
""",

        "Interview": """
Answer like a technical interview.

Be concise.

Highlight definitions.

Mention viva points.
""",

        "Research": """
Provide detailed technical explanations.

Use advanced terminology.

Explain implementation details deeply.
""",

        "Exam Prep": """
Answer in revision format.

Use bullet points.

Highlight important concepts.

Provide exam-focused summaries.
"""
    }

    return prompts.get(
        mode,
        prompts["Beginner"]
    )


def load_docs_metadata():

    if os.path.exists(
        DOCS_METADATA_FILE
    ):

        with open(
            DOCS_METADATA_FILE,
            "r"
        ) as f:

            return json.load(f)

    return {
        "documents": [],
        "collections": ["General"]
    }


def save_docs_metadata(metadata):

    with open(
        DOCS_METADATA_FILE,
        "w"
    ) as f:

        json.dump(
            metadata,
            f,
            indent=4
        )

# =========================
# CACHE HELPERS
# =========================


def save_chunks(
    doc_id,
    chunks
):

    import pickle

    with open(
        f"{CACHE_DIR}/{doc_id}.pkl",
        "wb"
    ) as f:

        pickle.dump(
            chunks,
            f
        )


def load_chunks(doc_id):

    import pickle

    with open(
        f"{CACHE_DIR}/{doc_id}.pkl",
        "rb"
    ) as f:

        return pickle.load(f)

# =========================
# PDF EXTRACTION
# =========================


def extract_pdf_content(
    file_path
):

    try:
        print(f"Starting extraction for: {file_path}")
        loader = PyPDFLoader(
            file_path
        )

        docs = loader.load()

        cleaned_docs = []

        for i, doc in enumerate(docs):

            text = (
                doc.page_content
                .strip()
            )

            # SKIP EMPTY PAGES

            if len(text) < 30:
                continue

            doc.metadata.update({

                "page": i,

                "ocr_used": False,

                "extraction_type":
                    "standard"
            })

            cleaned_docs.append(doc)

        print(
            f"Pages extracted: {len(cleaned_docs)}"
        )

        return cleaned_docs

    except Exception as e:

        print(
            f"PDF extraction failed: {e}"
        )

        return []

# =========================
# STARTUP SYNC
# =========================


@app.on_event("startup")
async def startup_event():

    sync_existing_files()


def sync_existing_files():

    global vector_store
    global bm25_retriever
    global all_chunks

    print("Syncing existing files...")

    metadata = (
        load_docs_metadata()
    )

    all_docs = []

    for d in metadata["documents"]:

        try:
            print(f"Loading chunks for doc: {d['name']}")
            cached_chunks = (
                load_chunks(
                    d["id"]
                )
            )

            all_docs.extend(
                cached_chunks
            )

        except Exception as e:

            print(
                f"Cache loading failed for {d['name']}: {e}"
            )

    all_chunks = all_docs

    if all_chunks:
        try:
            print(f"Initializing FAISS with {len(all_chunks)} chunks...")
            vector_store = (
                FAISS.from_documents(
                    all_chunks,
                    embeddings
                )
            )

            vector_store.save_local(
                VECTOR_DB_DIR
            )

            print("Initializing BM25...")
            bm25_retriever = (
                BM25Retriever
                .from_documents(
                    all_chunks
                )
            )

            bm25_retriever.k = 3
            print("Sync complete.")
        except Exception as e:
            print(f"Vector store initialization failed: {e}")

# =========================
# UPLOAD PDF
# =========================


@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),

    collection: str = Form(
        "General"
    )
):

    global vector_store
    global bm25_retriever
    global all_chunks

    if not file.filename.endswith(
        ".pdf"
    ):

        raise HTTPException(
            status_code=400,
            detail=
                "Only PDF files allowed"
        )

    doc_id = str(uuid.uuid4())

    file_path = os.path.join(
        UPLOAD_DIR,
        f"{doc_id}_{file.filename}"
    )

    try:

        # SAVE FILE

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        # =========================
        # EXTRACT CONTENT
        # =========================

        documents = (
            extract_pdf_content(
                file_path
            )
        )

        if not documents:

            raise HTTPException(
                status_code=400,
                detail=
                    "Could not extract text from PDF"
            )

        # =========================
        # METADATA
        # =========================

        current_time = (
            time.strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        )

        for i, doc in enumerate(documents):

            doc.metadata.update({

                "doc_id": doc_id,

                "source_file":
                    file.filename,

                "upload_timestamp":
                    current_time,

                "collection":
                    collection,

                "section":
                    f"Page {i + 1}"
            })

        # =========================
        # CHUNKING
        # =========================

        print(f"Splitting {len(documents)} pages into chunks...")

        text_splitter = (
            RecursiveCharacterTextSplitter(

                chunk_size=1500,

                chunk_overlap=100
            )
        )

        chunks = (
            text_splitter
            .split_documents(
                documents
            )
        )

        print(f"Created {len(chunks)} chunks.")

        # =========================
        # CACHE
        # =========================

        save_chunks(
            doc_id,
            chunks
        )

        # =========================
        # VECTOR STORE
        # =========================

        print("Updating vector store...")

        try:
            if os.path.exists(VECTOR_DB_DIR):
                print("Loading existing FAISS index...")
                try:
                    loaded_db = FAISS.load_local(
                        VECTOR_DB_DIR,
                        embeddings,
                        allow_dangerous_deserialization=True
                    )
                    
                    if vector_store is None:
                        vector_store = loaded_db
                    
                    vector_store.add_documents(chunks)
                    print("Added documents to existing FAISS index.")
                except Exception as load_err:
                    print(f"Failed to load existing FAISS index: {load_err}")
                    print("Creating new FAISS index instead...")
                    vector_store = FAISS.from_documents(
                        chunks,
                        embeddings
                    )
            else:
                print("Creating new FAISS index...")
                vector_store = FAISS.from_documents(
                    chunks,
                    embeddings
                )

            vector_store.save_local(VECTOR_DB_DIR)
            print("FAISS index saved successfully.")

        except Exception as vector_err:
            print(f"CRITICAL VECTOR STORE ERROR: {vector_err}")
            raise vector_err

        # =========================
        # BM25
        # =========================

        print("Updating BM25...")
        all_chunks.extend(chunks)

        bm25_retriever = (
            BM25Retriever
            .from_documents(
                all_chunks
            )
        )

        bm25_retriever.k = 3

        # =========================
        # METADATA SAVE
        # =========================

        print("Saving metadata...")

        metadata = (
            load_docs_metadata()
        )

        metadata["documents"].append({

            "id": doc_id,

            "name": file.filename,

            "collection":
                collection,

            "upload_time":
                current_time,

            "chunk_count":
                len(chunks)
        })

        if (
            collection
            not in metadata["collections"]
        ):

            metadata[
                "collections"
            ].append(collection)

        save_docs_metadata(
            metadata
        )

        print(f"Upload complete for: {file.filename}")

        return {

            "message":
                "PDF uploaded successfully",

            "doc_id":
                doc_id,

            "filename":
                file.filename,

            "chunks_created":
                len(chunks),

            "url":
                f"http://localhost:8001/uploads/{doc_id}_{file.filename}"
        }

    except Exception as e:

        import traceback
        print("UPLOAD FAILED!")
        print(traceback.format_exc())

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================
# DOCUMENTS
# =========================


@app.get("/documents")
async def get_documents():

    return load_docs_metadata()

# =========================
# CHAT
# =========================


@app.post("/chat")
async def chat(payload: dict):

    global vector_store
    global bm25_retriever
    global all_chunks

    question = payload.get(
        "question"
    )

    history = payload.get(
        "history",
        []
    )

    collection_filter = payload.get(
        "collection"
    )

    mode = payload.get(
        "mode",
        "Beginner"
    )

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question required"
        )

    if vector_store is None:

        print("Chat failed: Vector store is None. Ensure PDFs are uploaded correctly.")

        raise HTTPException(
            status_code=400,
            detail="No PDF content processed yet. Please upload a PDF first."
        )

    # =========================
    # HISTORY FORMAT
    # =========================

    formatted_history = ""

    for msg in history:

        role = msg.get("role")

        content = msg.get("content")

        if role == "user":

            formatted_history += (
                f"User: {content}\n"
            )

        elif role == "assistant":

            formatted_history += (
                f"Assistant: {content}\n"
            )

    # =========================
    # SEARCH
    # =========================

    try:
        if collection_filter:
            faiss_docs = vector_store.similarity_search(
                question,
                k=5,
                filter={"collection": collection_filter}
            )
        else:
            faiss_docs = vector_store.similarity_search(
                question,
                k=5
            )

        bm25_docs = []
        if bm25_retriever:
            bm25_docs = bm25_retriever.invoke(question)

        combined_docs = faiss_docs + bm25_docs
        
        docs = []
        seen = set()
        for doc in combined_docs:
            if doc.page_content not in seen:
                docs.append(doc)
                seen.add(doc.page_content)
        docs = docs[:6]

    except Exception as search_err:
        print(f"RAG Retrieval failed: {search_err}")
        # FALLBACK: CONTINUE WITH NO CONTEXT IF SEARCH FAILS
        docs = []

    context_text = "\n\n".join([
        doc.page_content
        for doc in docs
    ]) if docs else "No relevant context found."

    # =========================
    # SOURCES
    # =========================

    sources = []

    for doc in docs:

        sources.append({

            "content":
                doc.page_content[:200],

            "metadata": {

                "page":
                    doc.metadata.get(
                        "page",
                        0
                    ),

                "source":
                    doc.metadata.get(
                        "source_file",
                        "Unknown"
                    ),

                "section":
                    doc.metadata.get(
                        "section",
                        "N/A"
                    ),

                "collection":
                    doc.metadata.get(
                        "collection",
                        "General"
                    ),

                "extraction_type":
                    doc.metadata.get(
                        "extraction_type",
                        "standard"
                    ),

                "ocr_used":
                    doc.metadata.get(
                        "ocr_used",
                        False
                    )
            }
        })

    # =========================
    # GEMINI MODEL
    # =========================

    llm = ChatGoogleGenerativeAI(

        model="gemini-1.5-flash",

        google_api_key=GEMINI_API_KEY,

        temperature=0,

        streaming=True
    )

    # =========================
    # PROMPT
    # =========================

    template = f"""
You are an intelligent AI study assistant.

Response Style:
{get_mode_prompt(mode)}

Answer ONLY from provided context.

IMPORTANT: 
- Cite sources using [1], [2], etc. based on the context provided.
- ALWAYS refer to specific sections or pages if mentioned in context.
- If answer is unavailable, say you don't know.

Conversation History:
{{history}}

Context:
{{context}}

Question:
{{question}}
"""

    prompt = (
        ChatPromptTemplate
        .from_template(template)
    )

    # =========================
    # STREAMING
    # =========================

    async def generate_stream():

        try:

            yield json.dumps({

                "type": "sources",

                "data": sources

            }) + "\n"

            chain = (
                prompt
                | llm
                | StrOutputParser()
            )

            async for chunk in chain.astream({

                "context":
                    context_text,

                "question":
                    question,

                "history":
                    formatted_history

            }):

                print("STREAM:", chunk)

                yield json.dumps({

                    "type": "chunk",

                    "data": chunk

                }) + "\n"

        except Exception as e:

            print("STREAM ERROR:", str(e))

            yield json.dumps({

                "type": "chunk",

                "data":
                    f"\n\nError: {str(e)}"

            }) + "\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/plain"
    )

# =========================
    # SUMMARIZE
    # =========================


@app.post("/summarize")
async def summarize(payload: dict):

    global vector_store

    collection_filter = payload.get(
        "collection"
    )

    if vector_store is None:

        raise HTTPException(
            status_code=400,
            detail="No PDFs uploaded"
        )

    # RETRIEVE MORE CONTEXT FOR SUMMARY

    try:
        if collection_filter:
            docs = vector_store.similarity_search(
                "Summary of the main concepts and key points",
                k=15,
                filter={"collection": collection_filter}
            )
        else:
            docs = vector_store.similarity_search(
                "Summary of the main concepts and key points",
                k=15
            )
    except Exception as e:
        print(f"Summary retrieval failed: {e}")
        docs = []

    context_text = "\n\n".join([
        doc.page_content
        for doc in docs
    ]) if docs else "No content available for summary."

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0,
        streaming=True
    )

    template = """
You are an expert academic researcher. 
Create a STRUCTURED SUMMARY of the provided context.

Follow this EXACT format:

# 📝 Structured Summary

## 💡 Key Concepts
- Concept 1: Brief explanation
- Concept 2: Brief explanation
...

## 📖 Comprehensive Summary
Provide a 2-3 paragraph detailed summary of the main topics.

## 🚀 Key Takeaways
1. Most important point
2. Second most important point
...

Answer ONLY from provided context.

Context:
{context}
"""

    prompt = (
        ChatPromptTemplate
        .from_template(template)
    )

    async def generate_stream():

        try:

            chain = (
                prompt
                | llm
                | StrOutputParser()
            )

            async for chunk in chain.astream({
                "context": context_text
            }):

                print("SUMMARIZE:", chunk)

                yield json.dumps({
                    "type": "chunk",
                    "data": chunk
                }) + "\n"

        except Exception as e:

            print("SUMMARIZE ERROR:", str(e))

            yield json.dumps({
                "type": "chunk",
                "data": f"\n\nError: {str(e)}"
            }) + "\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/plain"
    )

# =========================
# DELETE DOCUMENT
# =========================


@app.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str
):

    global vector_store
    global bm25_retriever
    global all_chunks

    metadata = (
        load_docs_metadata()
    )

    doc = next(

        (
            d for d in
            metadata["documents"]

            if d["id"] == doc_id
        ),

        None
    )

    if not doc:

        raise HTTPException(
            status_code=404,
            detail=
                "Document not found"
        )

    # DELETE PDF

    file_path = os.path.join(

        UPLOAD_DIR,

        f"{doc_id}_{doc['name']}"
    )

    if os.path.exists(file_path):

        os.remove(file_path)

    # DELETE CACHE

    cache_file = (
        f"{CACHE_DIR}/{doc_id}.pkl"
    )

    if os.path.exists(cache_file):

        os.remove(cache_file)

    # UPDATE METADATA

    metadata["documents"] = [

        d for d in
        metadata["documents"]

        if d["id"] != doc_id
    ]

    save_docs_metadata(
        metadata
    )

    # REBUILD VECTOR STORE

    all_chunks = []

    for d in metadata["documents"]:

        try:

            cached_chunks = (
                load_chunks(
                    d["id"]
                )
            )

            all_chunks.extend(
                cached_chunks
            )

        except Exception as e:

            print(e)

    if all_chunks:

        vector_store = (
            FAISS.from_documents(
                all_chunks,
                embeddings
            )
        )

        vector_store.save_local(
            VECTOR_DB_DIR
        )

        bm25_retriever = (
            BM25Retriever
            .from_documents(
                all_chunks
            )
        )

        bm25_retriever.k = 3

    else:

        vector_store = None

        bm25_retriever = None

        if os.path.exists(
            VECTOR_DB_DIR
        ):

            shutil.rmtree(
                VECTOR_DB_DIR
            )

    return {
        "message":
            "Document deleted successfully"
    }

# =========================
# RUN SERVER
# =========================


if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001
    )
