from fastapi import APIRouter, Depends, Header, HTTPException
import time
from app.schemas.requests import BaseAnalysisRequest, ComplianceRequest, EmbedRequest, ChatRequest
from app.schemas.responses import AnalysisResponse, HealthResponse
from app.workflows.langgraph_flow import execute_workflow
from app.agents.quality_agent import run_quality_agent
from app.agents.security_agent import run_security_agent
from app.agents.governance_agent import run_governance_agent
from app.agents.compliance_agent import run_compliance_agent
from app.rag.compliance_rag import ingest_document, retrieve_controls
from app.memory.conversation import memory_store
from app.services.cache import cache_get, cache_set, cache_clear
from app.vectorstore.faiss_store import faiss_store
from app.utils.config import settings
from app.services.ollama import ask_ollama_json

async def verify_internal_token(x_internal_token: str = Header(None)):
    token = settings.internal_token
    if not token or x_internal_token != token:
        # In docker-compose network isolation this can be relaxed; header still sent by backend
        raise HTTPException(status_code=401, detail="invalid internal token")
    return True


router = APIRouter(prefix="/ai", tags=["ai"], dependencies=[Depends(verify_internal_token)])


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

    # Derive confidence from common agent score fields (0-100 -> 0-1) or explicit confidence
    confidence: Optional[float] = None
    for key in ("confidence", "quality_score", "policy_coverage", "compliance_percentage", "risk_score"):
        if key in result and result[key] is not None:
            val = float(result[key])
            confidence = val / 100.0 if val > 1.0 else val
            break
    if confidence is None and result.get("confidence_notes"):
        # heuristic if notes present
        confidence = 0.75

    # Prefer explicit llm_used threaded from agent (reflects ollama disabled / error / success)
    if "llm_used" in result:
        llm_used = bool(result.get("llm_used"))
    else:
        llm_used = bool(
            result.get("confidence_notes")
            or any(k.startswith("llm_") or "llm" in str(k).lower() for k in result.keys())
            or any(bool(v) for k, v in result.items() if "llm" in str(k).lower())
        )

    meta = {
        "provider": "open-source-models",
        "latency_ms": 0,  # overwritten by caller with real agent wall time
        "version": "1.0",
    }

    return AnalysisResponse(
        success=True,
        analysis_type=analysis_type,
        confidence=confidence,
        explanation=explanation,
        result=result,
        metadata=meta,
        llm_used=llm_used or None,
    )


def _content_hash(req: BaseAnalysisRequest) -> str:
    h = getattr(req, "source_hash", None)
    if h:
        return str(h)
    return str(hash(str(req.payload)))


@router.post('/quality', response_model=AnalysisResponse)
async def quality(req: BaseAnalysisRequest):
    ck = f"quality:{req.organization_id}:{req.project_id}:{_content_hash(req)}"
    cached = cache_get(ck)
    if cached:
        return cached
    t0 = time.perf_counter()
    agent_result = run_quality_agent(req.payload)
    resp = envelope('quality', agent_result)
    resp.metadata["latency_ms"] = int((time.perf_counter() - t0) * 1000)
    cache_set(ck, resp.model_dump() if hasattr(resp, "model_dump") else resp.dict(), ttl=900)
    return resp


@router.post('/security', response_model=AnalysisResponse)
async def security(req: BaseAnalysisRequest):
    ck = f"security:{req.organization_id}:{req.project_id}:{_content_hash(req)}"
    cached = cache_get(ck)
    if cached:
        return cached
    t0 = time.perf_counter()
    agent_result = run_security_agent(req.payload)
    resp = envelope('security', agent_result)
    resp.metadata["latency_ms"] = int((time.perf_counter() - t0) * 1000)
    cache_set(ck, resp.model_dump() if hasattr(resp, "model_dump") else resp.dict(), ttl=900)
    return resp


@router.post('/governance', response_model=AnalysisResponse)
async def governance(req: BaseAnalysisRequest):
    ck = f"governance:{req.organization_id}:{req.project_id}:{_content_hash(req)}"
    cached = cache_get(ck)
    if cached:
        return cached
    t0 = time.perf_counter()
    agent_result = run_governance_agent(req.payload)
    resp = envelope('governance', agent_result)
    resp.metadata["latency_ms"] = int((time.perf_counter() - t0) * 1000)
    cache_set(ck, resp.model_dump() if hasattr(resp, "model_dump") else resp.dict(), ttl=900)
    return resp


@router.post('/compliance', response_model=AnalysisResponse)
async def compliance(req: ComplianceRequest):
    ck = f"compliance:{req.organization_id}:{req.project_id}:{_content_hash(req)}"
    cached = cache_get(ck)
    if cached:
        return cached
    t0 = time.perf_counter()
    agent_result = run_compliance_agent(req.payload | {"frameworks": req.frameworks})
    resp = envelope('compliance', agent_result)
    resp.metadata["latency_ms"] = int((time.perf_counter() - t0) * 1000)
    cache_set(ck, resp.model_dump() if hasattr(resp, "model_dump") else resp.dict(), ttl=900)
    return resp


@router.post('/workflow')
async def workflow(req: BaseAnalysisRequest):
    mode = req.mode or (req.payload or {}).get("mode")
    cache_key = f"workflow:{req.organization_id}:{req.project_id}:{mode}:{hash(str(req.payload))}"
    cached = cache_get(cache_key)
    if cached:
        return {"success": True, "cached": True, "data": cached}

    data = execute_workflow(req.payload, mode=mode)
    cache_set(cache_key, data, ttl=900)
    return {"success": True, "cached": False, "data": data}


@router.post('/embed')
async def embed(req: EmbedRequest):
    joined = "\n".join(req.texts)
    result = ingest_document(joined, {"organization_id": req.organization_id, "document_id": req.document_id} | req.metadata)
    return {"success": True, "result": result}


@router.post('/chat')
async def chat(req: ChatRequest):
    # RAG retrieve + LLM + LangChain memory (ConversationBufferMemory wrapper)
    controls = retrieve_controls(req.query or "data retention and access controls")[:5]
    ctx_text = "\n".join(str(c.get("text", c))[:400] for c in controls)
    hist = memory_store.get_buffer(req.session_id)

    # record the query
    memory_store.add(req.session_id, req.query)

    system = (
        "You are CloudShield, an expert assistant for data governance, security, quality and compliance (PDPB, GDPR, ISO, SOC2). "
        "Ground every answer in the retrieved controls context when possible. Be concise. If unsure say so."
    )
    user_p = f"Retrieved controls context:\n{ctx_text or 'none'}\n\nConversation history:\n{hist or 'none'}\n\nCurrent user question: {req.query}\n\nRespond ONLY with JSON: {{\"answer\": \"...\"}}"

    llm_res, llm_used = ask_ollama_json(
        model=getattr(settings, "model_reasoning", None) or settings.model_compliance,
        system_prompt=system,
        user_prompt=user_p,
        fallback={"answer": "RAG context loaded. Ask about PDPB retention, access controls, or anomaly handling."},
    )
    answer = llm_res.get("answer") or llm_res.get("summary") or "Context retrieved; LLM unavailable or disabled."
    mem_size = len(memory_store.get(req.session_id))

    return {
        "success": True,
        "answer": answer,
        "memory_size": mem_size,
        "llm_used": llm_used,
        "context_chunks": len(controls),
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
