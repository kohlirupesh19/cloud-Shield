from pydantic import BaseModel
import os


class Settings(BaseModel):
    app_name: str = os.getenv("APP_NAME", "CloudShield AI Engine")
    app_port: int = int(os.getenv("PORT", "8000"))
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    ollama_enabled: bool = os.getenv("OLLAMA_ENABLED", "true").lower() not in {"0", "false", "no"}
    # default to host.docker.internal so Docker containers can reach a host Ollama daemon on macOS
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
    ollama_timeout_seconds: float = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "45"))
    model_quality: str = os.getenv("MODEL_QUALITY", "qwen2.5:3b-instruct-q4_K_M")
    model_security: str = os.getenv("MODEL_SECURITY", "llama3.2:3b-instruct-q4_K_M")
    model_governance: str = os.getenv("MODEL_GOVERNANCE", "qwen2.5:3b-instruct-q4_K_M")
    model_compliance: str = os.getenv("MODEL_COMPLIANCE", "qwen2.5:3b-instruct-q4_K_M")
    model_reasoning: str = os.getenv("MODEL_REASONING", "phi3.5")
    embedding_model: str = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")


settings = Settings()
