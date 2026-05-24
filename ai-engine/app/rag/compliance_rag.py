from typing import List
from app.vectorstore.faiss_store import faiss_store


def chunk_text(text: str, chunk_size: int = 700, overlap: int = 100) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += max(1, chunk_size - overlap)
    return chunks


def ingest_document(document_text: str, metadata: dict):
    chunks = chunk_text(document_text)
    faiss_store.add(chunks, metadata)
    return {"chunks": len(chunks)}


def retrieve_controls(query: str):
    return faiss_store.search(query)
