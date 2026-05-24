from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class BaseAnalysisRequest(BaseModel):
    organization_id: str
    project_id: str
    dataset_id: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)


class ComplianceRequest(BaseAnalysisRequest):
    frameworks: List[str] = Field(default_factory=lambda: ["ISO 27001", "PDPB", "GDPR", "SOC2"])


class EmbedRequest(BaseModel):
    organization_id: str
    document_id: str
    texts: List[str]
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ChatRequest(BaseModel):
    session_id: str
    query: str
    context: Dict[str, Any] = Field(default_factory=dict)
