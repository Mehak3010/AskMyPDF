import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from ingest import ingest_pdf
from rag import query_rag

load_dotenv()
api_key = "AIzaSyDGkfvhTHjgeW1gncFBjABhCmpSrWmqbwU"
PDF_PATH = r"c:\Users\lenovo\Downloads\AskMyPDF\backend\uploads\GRP-5_MajorProject_Report.pdf"

def test_direct():
    print("--- Testing Ingestion Directly ---")
    session_id = "test_session_direct"
    try:
        chunks = ingest_pdf(PDF_PATH, session_id)
        print(f"Ingestion Success: {chunks} chunks")
        
        print("\n--- Testing Retrieval & Chat Directly ---")
        answer = query_rag(session_id, "What is the project about?")
        print(f"AI Answer: {answer}")
    except Exception as e:
        print(f"Direct test failed: {e}")

if __name__ == "__main__":
    test_direct()
