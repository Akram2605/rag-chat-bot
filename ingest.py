import os, uuid
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

def read_file(path: str) -> str:
    if path.endswith(".pdf"):
        reader = PdfReader(path)
        return "\n".join(p.extract_text() for p in reader.pages if p.extract_text())
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def ingest_docs(folder="./docs"):
    files = [f for f in os.listdir(folder) if f.endswith((".txt", ".pdf", ".md"))]
    print(f"Found {len(files)} documents")
    
    for filename in files:
        text = read_file(os.path.join(folder, filename))
        chunks = chunk_text(text)
        print(f"  {filename} → {len(chunks)} chunks")
        
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
    print("✅ Ingestion complete!")

if __name__ == "__main__":
    ingest_docs()