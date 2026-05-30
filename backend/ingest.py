import fitz

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter
)

from langchain_huggingface import (
    HuggingFaceEmbeddings
)

from langchain_chroma import Chroma

import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_DIR = "./chroma_db"

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

def extract_pages(pdf_path: str) -> list:
    doc = fitz.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text().strip()
        if text:
            pages.append({"text": text, "page": i + 1})
    return pages

def ingest_pdf(pdf_path: str, session_id: str) -> int:
    pages = extract_pages(pdf_path)

    # DEBUG — print how many pages have text
    print(f"[ingest] Found {len(pages)} pages with text")

    if not pages:
        raise ValueError("No extractable text found in PDF. It may be a scanned image-based PDF.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    all_chunks = []
    all_metadatas = []

    for page in pages:
        chunks = splitter.split_text(page["text"])
        for chunk in chunks:
            if chunk.strip():  # ← skip empty chunks
                all_chunks.append(chunk)
                all_metadatas.append({"page": page["page"]})

    print(f"[ingest] Total chunks to embed: {len(all_chunks)}")

    if not all_chunks:
        raise ValueError("PDF contained no usable text chunks.")

    vectorstore = Chroma(
        collection_name=session_id,
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR
    )
    vectorstore.add_texts(all_chunks, metadatas=all_metadatas)

    return len(all_chunks)