from pydantic import BaseModel
from typing import Any, Dict


class AnalysisResponse(BaseModel):
    success: bool
    analysis_type: str
    confidence: float
    explanation: str
    result: Dict[str, Any]
    metadata: Dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    model_provider: str
    vector_store: str
    cache: str
