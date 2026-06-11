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

def generate_flashcards(
    session_id: str
):

    docs = _get_docs(
        session_id,
        "Generate flashcards"
    )

    context = "\n\n".join(
        doc.page_content
        for doc in docs
    )

    prompt = f"""
Generate exactly 15 flashcards.

Return ONLY valid JSON.

Format:

{{
  "cards":[
    {{
      "front":"Question",
      "back":"Answer"
    }}
  ]
}}

Rules:
- Exactly 15 flashcards
- front = question
- back = answer
- concise but informative
- no markdown
- valid JSON only

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

def generate_exam_prep(
    session_id: str
):

    docs = _get_docs(
        session_id,
        "Generate exam preparation notes"
    )

    context = "\n\n".join(
        doc.page_content
        for doc in docs
    )

    prompt = f"""
Create exam preparation material from the PDF.

Return ONLY valid JSON.

Format:

{{
  "important_topics": [
    "..."
  ],

  "long_questions": [
    "..."
  ],

  "short_questions": [
    "..."
  ],

  "definitions": [
    {{
      "term": "...",
      "meaning": "..."
    }}
  ],

  "viva_questions": [
    {{
      "question": "...",
      "answer": "..."
    }}
  ]
}}

Rules:

- 10 important topics
- 5 long questions
- 10 short questions
- 10 definitions
- 10 viva questions with answers
- Return JSON only
- No markdown
- No extra text

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

def generate_viva_questions(
    session_id: str
):

    docs = _get_docs(
        session_id,
        "Generate viva questions"
    )

    context = "\n\n".join(
        doc.page_content
        for doc in docs
    )

    prompt = f"""
Generate exactly 10 viva questions.

Return ONLY valid JSON.

Format:

{{
  "questions":[
    {{
      "question":"...",
      "answer":"..."
    }}
  ]
}}

Rules:

- Exactly 10 questions
- Each question must have an answer
- Answers should be concise but interview-ready
- Return valid JSON only
- No markdown
- No extra text

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

def generate_study_kit(
    session_id: str
):

    docs = _get_docs(
        session_id,
        "Generate complete study kit"
    )

    context = "\n\n".join(
        doc.page_content
        for doc in docs
    )

    prompt = f"""
Create a COMPLETE EXAM STUDY KIT from the PDF.

Return ONLY valid JSON.

Format:

{{
  "summary": "...",

  "important_topics": [
    "..."
  ],

  "definitions": [
    {{
      "term": "...",
      "meaning": "..."
    }}
  ],

  "long_questions": [
    {{
        "question": "...",
        "answer": [
            "...",
            "...",
            "...",
            "...",
            "..."
        ]
    }}
  ],

  "short_questions": [
    {{
        "question": "...",
        "answer": "..."
    }}
  ],

  "important_questions": [
    {{
        "question": "...",
        "answer": [
            "...",
            "...",
            "...",
            "...",
            "..."
        ]
    }}
  ],

  "viva_questions": [
    {{
      "question": "...",
      "answer": "..."
    }}
  ],

  "mcq_revision": [
    {{
      "question": "...",
      "answer": "...",
      "explanation": "..."
    }}
  ],

  "revision_sheet": [
    "..."
  ]
}}

Rules:

SUMMARY
- Create a detailed exam-oriented summary.
- Use simple language.
- Focus on concepts likely to appear in exams.

IMPORTANT TOPICS
- Generate exactly 10 most important topics.

DEFINITIONS
- Generate exactly 10 key definitions.
- Keep definitions concise and exam-friendly.

LONG QUESTIONS
- Generate exactly 5 descriptive exam questions.
- Answers must contain 5-8 concise exam-oriented points.
- Return answers as an array of strings.

SHORT QUESTIONS
- Generate exactly 10 short-answer questions.
- Answers should be 2–4 lines.

IMPORTANT QUESTIONS
- Generate exactly 10 highly probable exam questions.
- Answers must contain 5-8 concise exam-oriented points.
- Return answers as an array of strings.

VIVA QUESTIONS
- Generate exactly 10 viva questions.
- Include concise model answers.

MCQ REVISION
- Generate exactly 10 MCQs.
- Include only:
  question
  answer
  explanation
- Keep explanations short.

REVISION SHEET
- Generate exactly 15 one-line revision points.
- These should be suitable for last-minute revision.

GENERAL RULES
- Avoid duplicates.
- Use information only from the PDF.
- Make content exam-oriented.
- Return valid JSON only.
- No markdown.
- No code fences.
- No additional text.

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