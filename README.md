# RAG Chatbot

A full-stack Retrieval-Augmented Generation (RAG) chatbot that lets you upload documents and ask questions about them. Each answer is shown side-by-side with a plain LLM response so you can see exactly what the document context adds.

## Architecture

```
frontend/          Next.js 16 (React 19, Tailwind CSS 4)
  app/
    api/chat/      Proxy → FastAPI /chat
    api/ingest/    Proxy → FastAPI /ingest
    page.tsx       Chat + Documents UI

main.py            FastAPI backend
rag.py             Embed → retrieve → generate (OpenAI + ChromaDB)
ingest.py          PDF/TXT/MD → chunk → embed → store
chroma_db/         Persistent ChromaDB vector store (auto-created)
```

## Features

- Upload PDF, TXT, or Markdown files via drag-and-drop
- Documents are chunked (500 words, 50-word overlap) and embedded with `text-embedding-3-small`
- Questions retrieve the top-20 relevant chunks from ChromaDB and pass them to `gpt-4o`
- Responses are shown in two columns: **With RAG** vs **Without RAG**
- Uploading a new batch clears the previous collection

## Prerequisites

- Python 3.11+
- Node.js 18+
- An OpenAI API key

## Setup

### Backend

```bash
# Install dependencies (uv recommended, pip also works)
uv sync
# or: pip install -r requirements.txt

# Create a .env file
echo "OPENAI_API_KEY=sk-..." > .env

# Start the API server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Optional: point at a non-default backend
# BACKEND_URL=http://localhost:8000  (this is already the default)

npm run dev   # starts on http://localhost:3000
```

## Usage

1. Open `http://localhost:3000`.
2. Click **Documents**, drag in your files (PDF / TXT / MD), then click **Ingest Documents**.
3. Switch to **Chat** and ask questions. Each reply shows the RAG-augmented answer alongside the LLM-only answer.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat` | `{ "question": "..." }` → `{ rag_answer, llm_answer, sources }` |
| `POST` | `/ingest` | `multipart/form-data` with one or more files → `{ ingested: [{ file, chunks }] }` |
| `GET`  | `/health` | `{ "status": "ok" }` |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key |
| `BACKEND_URL` | No | `http://localhost:8000` | Backend URL (frontend only) |
