import os
from dotenv import load_dotenv
load_dotenv()  # ← first

# verify key loaded
if not os.getenv("GROQ_API_KEY"):
    raise RuntimeError("GROQ_API_KEY not found in .env")

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import Groq
import uuid, shutil, json

from ingest import ingest_pdf
from rag import (
    query_rag,
    get_sources,
    generate_quiz
)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allowing all for development as in previous state
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Upload PDF ---
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    session_id = str(uuid.uuid4())
    pdf_path = os.path.join(UPLOAD_DIR, f"{session_id}.pdf")
    
    with open(pdf_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    try:
        chunk_count = ingest_pdf(pdf_path, session_id)
        return {
            "session_id": session_id,
            "filename": file.filename,
            "chunks": chunk_count,
            "url": f"http://localhost:8001/uploads/{session_id}.pdf" # Keeping compatibility with viewer
        }
    except Exception as e:
        print(f"Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Chat ---
class ChatRequest(BaseModel):
    session_id: str
    question: str
    history: list = []
    mode: str = "Beginner"

@app.post("/chat")
async def chat(req: ChatRequest):
    if not req.session_id or not req.question:
        raise HTTPException(status_code=400, detail="session_id and question required")
    
    async def stream():
        # Send sources first
        try:
            sources = get_sources(req.session_id, req.question)
            yield json.dumps({"type": "sources", "data": sources}) + "\n"
        except Exception as e:
            print(f"Failed to get sources: {e}")

        # Stream the answer
        try:
            answer = query_rag(req.session_id, req.question)
            # Stream word by word
            words = answer.split(" ")
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                yield json.dumps({"type": "chunk", "data": chunk}) + "\n"
        except Exception as e:
            print(f"Chat failed: {e}")
            yield json.dumps({"type": "chunk", "data": f"Error: {str(e)}"}) + "\n"

    return StreamingResponse(stream(), media_type="text/plain")

#--- Quiz ---

class QuizRequest(BaseModel):
    session_id: str


@app.post("/generate-quiz")
async def quiz(req: QuizRequest):

    try:

        quiz_text = generate_quiz(
            req.session_id
        )

        cleaned = (
            quiz_text
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        return json.loads(
            cleaned
        )

    except Exception as e:

        print(
            "QUIZ ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )  
        
# --- Health check ---
@app.get("/")
def root():
    return {"status": "RAG backend running"}

if __name__ == "__main__":
    import uvicorn
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not found in .env")
    print(f"API KEY LOADED: {api_key[:10]}...")
    uvicorn.run(app, host="0.0.0.0", port=8001)