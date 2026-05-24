from sentence_transformers import SentenceTransformer
from app.utils.config import settings


_model = SentenceTransformer(settings.embedding_model)


def embed_texts(texts):
    return _model.encode(texts, normalize_embeddings=True)
