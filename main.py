from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from rag import rag_answer

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

class Query(BaseModel):
    question: str

@app.get("/")
def root():
    return FileResponse("static/index.html")

@app.post("/chat")
def chat(query: Query):
    return rag_answer(query.question)

@app.get("/health")
def health():
    return {"status": "ok"}