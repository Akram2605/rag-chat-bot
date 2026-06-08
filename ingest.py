import io, os, uuid
from dotenv import load_dotenv
from openai import OpenAI
import chromadb
from pypdf import PdfReader

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("docs")

def chunk_text(text: str, size=500, overlap=50) -> list[str]:
    words = text.split()
    chunks = []
    for i in range(0, len(words), size - overlap):
        chunks.append(" ".join(words[i:i+size]))
    return chunks

def extract_text(filename: str, content: bytes) -> str:
    if filename.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(p.extract_text() for p in reader.pages if p.extract_text())
    return content.decode("utf-8")

def ingest_file(filename: str, content: bytes) -> int:
    text = extract_text(filename, content)
    chunks = chunk_text(text)
    for chunk in chunks:
        emb = client.embeddings.create(
            input=chunk, model="text-embedding-3-small"
        ).data[0].embedding
        collection.add(
            ids=[str(uuid.uuid4())],
            embeddings=[emb],
            documents=[chunk],
            metadatas=[{"source": filename}]
        )
    return len(chunks)

def clear_collection():
    existing = collection.get()
    if existing["ids"]:
        collection.delete(ids=existing["ids"])