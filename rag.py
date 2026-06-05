import os
from dotenv import load_dotenv
from openai import OpenAI
import chromadb

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("docs")

def embed(text: str) -> list[float]:
    res = client.embeddings.create(input=text, model="text-embedding-3-small")
    return res.data[0].embedding

def retrieve(query: str, n=20) -> list[str]:
    query_emb = embed(query)
    results = collection.query(query_embeddings=[query_emb], n_results=n)
    return results["documents"][0]  # list of top-n chunks

def generate(query: str, context_chunks: list[str]) -> str:
    context = "\n\n---\n\n".join(context_chunks)
    system_prompt = f"""You are a helpful assistant."

CONTEXT:
{context}"""
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ],
        temperature=0.2
    )
    return response.choices[0].message.content

def rag_answer(query: str) -> dict:
    chunks = retrieve(query)
    answer = generate(query, chunks)
    return {"answer": answer, "sources": chunks}