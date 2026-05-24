from typing import List, Dict, Any
import faiss
import numpy as np
from app.embeddings.embedder import embed_texts


class FaissStore:
    def __init__(self, dim: int = 384):
        self.index = faiss.IndexFlatIP(dim)
        self.metadata: List[Dict[str, Any]] = []

    def add(self, texts: List[str], metadata: Dict[str, Any]):
        vectors = embed_texts(texts)
        vectors = np.array(vectors, dtype='float32')
        self.index.add(vectors)
        self.metadata.extend([{**metadata, "text": t} for t in texts])

    def search(self, query: str, k: int = 5, threshold: float = 0.35):
        q = np.array(embed_texts([query]), dtype='float32')
        scores, idx = self.index.search(q, k)
        results = []
        for s, i in zip(scores[0], idx[0]):
            if i >= 0 and s >= threshold and i < len(self.metadata):
                results.append({"score": float(s), **self.metadata[i]})
        return results

    def reset(self):
        self.index.reset()
        self.metadata.clear()


faiss_store = FaissStore()
