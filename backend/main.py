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

embeddings = (
    GoogleGenerativeAIEmbeddings(
        model=
            "models/text-embedding-004",

        google_api_key=os.getenv(
            "GEMINI_API_KEY"
        )
    )
)

# =========================
# METADATA HELPERS
# =========================


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

    metadata = (
        load_docs_metadata()
    )

    all_docs = []

    for d in metadata["documents"]:

        try:

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
                f"Cache loading failed: {e}"
            )

    all_chunks = all_docs

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

        if os.path.exists(
            VECTOR_DB_DIR
        ):

            if vector_store is None:

                vector_store = (
                    FAISS.load_local(
                        VECTOR_DB_DIR,

                        embeddings,

                        allow_dangerous_deserialization=True
                    )
                )

            vector_store.add_documents(
                chunks
            )

        else:

            vector_store = (
                FAISS.from_documents(
                    chunks,
                    embeddings
                )
            )

        vector_store.save_local(
            VECTOR_DB_DIR
        )

        # =========================
        # BM25
        # =========================

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

        print(e)

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

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question required"
        )

    if vector_store is None:

        raise HTTPException(
            status_code=400,
            detail="No PDFs uploaded"
        )

    # =========================
    # HISTORY FORMAT
    # =========================

    formatted_history = "\n".join([

        f"User: {msg.get('user')}\nAssistant: {msg.get('assistant')}"

        for msg in history
    ])

    # =========================
    # FAISS SEARCH
    # =========================

    if collection_filter:

        faiss_docs = (
            vector_store
            .similarity_search(
                question,
                k=5,
                filter={
                    "collection":
                        collection_filter
                }
            )
        )

    else:

        faiss_docs = (
            vector_store
            .similarity_search(
                question,
                k=5
            )
        )

    # =========================
    # BM25 SEARCH
    # =========================

    bm25_docs = []

    if bm25_retriever:

        bm25_docs = (
            bm25_retriever.invoke(
                question
            )
        )

    # =========================
    # MERGE + DEDUP
    # =========================

    combined_docs = (
        faiss_docs + bm25_docs
    )

    docs = []

    seen = set()

    for doc in combined_docs:

        if (
            doc.page_content
            not in seen
        ):

            docs.append(doc)

            seen.add(
                doc.page_content
            )

    docs = docs[:6]

    context_text = "\n\n".join([

        doc.page_content

        for doc in docs
    ])

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

        google_api_key=os.getenv(
            "GEMINI_API_KEY"
        ),

        temperature=0,

        streaming=True
    )

    # =========================
    # PROMPT
    # =========================

    template = """
You are an intelligent PDF research assistant.

Answer ONLY from provided context.

If answer is unavailable,
say you don't know.

Conversation History:
{history}

Context:
{context}

Question:
{question}
"""

    prompt = (
        ChatPromptTemplate
        .from_template(template)
    )

    # =========================
    # STREAMING
    # =========================

    async def generate_stream():

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

            yield json.dumps({

                "type": "chunk",

                "data": chunk

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
