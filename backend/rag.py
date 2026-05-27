from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from groq import Groq
from prompts import SYSTEM_PROMPT, build_prompt
import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_DIR = "./chroma_db"

# Embeddings still use Google (free, no quota issues)
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

# LLM switched to Groq
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def _get_docs(session_id: str, question: str):
    vectorstore = Chroma(
        collection_name=session_id,
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    return retriever.invoke(question)

def query_rag(session_id: str, question: str) -> str:
    docs = _get_docs(session_id, question)
    context = "\n\n".join(doc.page_content for doc in docs)

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_prompt(context, question)}
        ],
        max_tokens=4096,
        temperature=0.7
    )
    return response.choices[0].message.content

def get_sources(session_id: str, question: str) -> list:
    docs = _get_docs(session_id, question)
    return [
        {
            "page_content": doc.page_content[:200],
            "metadata": doc.metadata
        }
        for doc in docs
    ]