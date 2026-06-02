from pydantic import BaseModel
from typing import Any, Dict, Optional


class AnalysisResponse(BaseModel):
    success: bool
    analysis_type: str
    confidence: Optional[float] = None
    explanation: str
    result: Dict[str, Any]
    metadata: Dict[str, Any]
    llm_used: Optional[bool] = None


class HealthResponse(BaseModel):
    status: str
    model_provider: str
    vector_store: str
    cache: str
