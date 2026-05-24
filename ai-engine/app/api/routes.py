from fastapi import APIRouter
from app.schemas.requests import BaseAnalysisRequest, ComplianceRequest, EmbedRequest, ChatRequest
from app.schemas.responses import AnalysisResponse, HealthResponse
from app.workflows.langgraph_flow import execute_workflow
from app.agents.quality_agent import run_quality_agent
from app.agents.security_agent import run_security_agent
from app.agents.governance_agent import run_governance_agent
from app.agents.compliance_agent import run_compliance_agent
from app.rag.compliance_rag import ingest_document
from app.memory.conversation import memory_store
from app.services.cache import cache_get, cache_set, cache_clear
from app.vectorstore.faiss_store import faiss_store
from app.utils.config import settings

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get('/models')
async def models():
    return {
        "success": True,
        "provider": "ollama",
        "ollama_enabled": settings.ollama_enabled,
        "ollama_base_url": settings.ollama_base_url,
        "models": {
            "quality": settings.model_quality,
            "security": settings.model_security,
            "governance": settings.model_governance,
            "compliance": settings.model_compliance,
            "reasoning": settings.model_reasoning,
        },
        "recommended_quantized_models": [
            "qwen2.5:3b-instruct-q4_K_M",
            "llama3.2:3b-instruct-q4_K_M",
            "phi3.5",
            "phi3:mini",
        ],
    }


def envelope(analysis_type: str, result: dict) -> AnalysisResponse:
    explanation = result.get("explanation") or result.get("reasoning") or "Completed successfully"
    if isinstance(explanation, dict):
        if "text" in explanation:
            explanation = str(explanation["text"])
        elif "content" in explanation:
            explanation = str(explanation["content"])
        else:
            explanation = ", ".join(f"{k}: {v}" for k, v in explanation.items())
    elif not isinstance(explanation, str):
        explanation = str(explanation)

    return AnalysisResponse(
        success=True,
        analysis_type=analysis_type,
        confidence=0.9,
        explanation=explanation,
        result=result,
        metadata={
            "provider": "open-source-models",
            "latency_ms": 120,
            "version": "1.0",
        },
    )


@router.post('/quality', response_model=AnalysisResponse)
async def quality(req: BaseAnalysisRequest):
    return envelope('quality', run_quality_agent(req.payload))


@router.post('/security', response_model=AnalysisResponse)
async def security(req: BaseAnalysisRequest):
    return envelope('security', run_security_agent(req.payload))


@router.post('/governance', response_model=AnalysisResponse)
async def governance(req: BaseAnalysisRequest):
    return envelope('governance', run_governance_agent(req.payload))


@router.post('/compliance', response_model=AnalysisResponse)
async def compliance(req: ComplianceRequest):
    return envelope('compliance', run_compliance_agent(req.payload | {"frameworks": req.frameworks}))


@router.post('/workflow')
async def workflow(req: BaseAnalysisRequest):
    cache_key = f"workflow:{req.organization_id}:{req.project_id}:{hash(str(req.payload))}"
    cached = cache_get(cache_key)
    if cached:
        return {"success": True, "cached": True, "data": cached}

    data = execute_workflow(req.payload)
    cache_set(cache_key, data, ttl=900)
    return {"success": True, "cached": False, "data": data}


@router.post('/embed')
async def embed(req: EmbedRequest):
    joined = "\n".join(req.texts)
    result = ingest_document(joined, {"organization_id": req.organization_id, "document_id": req.document_id} | req.metadata)
    return {"success": True, "result": result}


@router.post('/chat')
async def chat(req: ChatRequest):
    memory_store.add(req.session_id, req.query)
    return {
        "success": True,
        "answer": "CloudShield assistant processed your query.",
        "memory_size": len(memory_store.get(req.session_id)),
    }


@router.post('/reset')
async def reset_state():
    memory_store.clear()
    faiss_store.reset()
    cache_clear()
    return {
        "success": True,
        "message": "AI engine state reset",
        "cleared": {
            "memory": True,
            "vectorstore": True,
            "workflow_cache": True,
        },
    }


@router.get('/health', response_model=HealthResponse)
async def health():
    return HealthResponse(status='ok', model_provider='ollama', vector_store='faiss', cache='redis')
