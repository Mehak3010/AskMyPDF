import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key exists: {bool(api_key)}")

try:
    print("Testing models/embedding-001...")
    embeddings = GoogleGenerativeAIEmbeddings(model='models/embedding-001', google_api_key=api_key)
    res = embeddings.embed_query('hello')
    print(f"Success! Dim: {len(res)}")
except Exception as e:
    print(f"Failed models/embedding-001: {e}")

try:
    print("\nTesting models/text-embedding-004...")
    embeddings4 = GoogleGenerativeAIEmbeddings(model='models/text-embedding-004', google_api_key=api_key)
    res4 = embeddings4.embed_query('hello')
    print(f"Success! Dim: {len(res4)}")
except Exception as e:
    print(f"Failed models/text-embedding-004: {e}")
