import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key: {api_key[:10]}...")

try:
    print("Testing models/gemini-embedding-001...")
    embeddings = GoogleGenerativeAIEmbeddings(
        model='models/gemini-embedding-001', 
        google_api_key=api_key
    )
    res = embeddings.embed_query('hello')
    print(f"Success! Dim: {len(res)}")
except Exception as e:
    print(f"Failed: {e}")
