from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag import rag_answer
from ingest import clear_collection, ingest_file

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

@app.post("/ingest")
async def upload_files(files: list[UploadFile] = File(...)):
    clear_collection()
    results = []
    for file in files:
        content = await file.read()
        chunks = ingest_file(file.filename, content)
        results.append({"file": file.filename, "chunks": chunks})
    return {"ingested": results}

@app.get("/health")
def health():
    return {"status": "ok"}
