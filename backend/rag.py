from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from groq import Groq
from prompts import SYSTEM_PROMPT, build_prompt
import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_DIR = "./chroma_db"

# Embeddings still use Google (free, no quota issues)
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
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
    
def generate_quiz(session_id: str):

    docs = _get_docs(
        session_id,
        "Generate quiz questions"
    )

    context = "\n\n".join(
        doc.page_content
        for doc in docs
    )

    prompt = f"""
Generate exactly 10 multiple choice questions.

Return ONLY valid JSON.

Format:

{{
  "questions":[
    {{
      "question":"...",
      "options":[
        "...",
        "...",
        "...",
        "..."
      ],
      "answer":"...",
      "explanation":"..."
    }}
  ]
}}

Rules:
- Exactly 10 questions
- 4 options per question
- One correct answer
- Every question MUST include an explanation
- Explanation should be 1-3 sentences
- Explanation should explain WHY the answer is correct
- Return valid JSON only
- No markdown
- No extra text outside JSON

Content:

{context}
"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3
    )

    return response.choices[0].message.content