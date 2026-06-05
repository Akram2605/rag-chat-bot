from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag import rag_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

class Query(BaseModel):
    question: str

@app.post("/chat")
def chat(query: Query):
    return rag_answer(query.question)

@app.get("/health")
def health():
    return {"status": "ok"}