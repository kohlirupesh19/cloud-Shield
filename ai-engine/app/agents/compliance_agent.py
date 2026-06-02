import json

from app.rag.compliance_rag import retrieve_controls
from app.services.ollama import ask_ollama_json
from app.utils.config import settings


def run_compliance_agent(payload: dict):
    query = payload.get("query", "")
    frameworks = payload.get("frameworks", ["ISO 27001", "PDPB", "GDPR", "SOC2"])
    controls = retrieve_controls(query or "data retention and access controls")

    evidence = []
    for control in controls[:5]:
        evidence.append({
            "score": round(float(control.get("score", 0.0)), 3),
            "text": control.get("text", ""),
            "source": control.get("sourceRef") or control.get("source") or "faiss",
            "framework": control.get("framework") or control.get("standard") or "unknown",
        })

    matched_controls = len(controls)
    baseline = 52.0 + min(28.0, matched_controls * 6.5) + min(12.0, len(frameworks) * 1.25)

    query_lower = query.lower()
    if any(keyword in query_lower for keyword in ["retention", "consent", "access", "transfer"]):
        baseline += 4.0

    coverage = min(100.0, baseline)
    missing_controls = []
    if coverage < 90:
        missing_controls = [
            "Incident response drill cadence",
            "Cross-border transfer register",
            "Named control owner for each framework",
        ]

    llm_result, llm_used = ask_ollama_json(
        model=settings.model_compliance,
        system_prompt="You are a compliance analyst. Return only JSON with keys summary, missing_controls, regulatory_suggestions, and confidence_notes.",
        user_prompt=json.dumps(
            {
                "query": query,
                "frameworks": frameworks,
                "matched_controls": matched_controls,
                "coverage": round(coverage, 2),
                "evidence": evidence,
                "missing_controls": missing_controls,
            },
            default=str,
        ),
        fallback={},
    )

    return {
        "compliance_percentage": round(coverage, 2),
        "matched_controls": matched_controls,
        "evidence": evidence,
        "missing_controls": llm_result.get("missing_controls", missing_controls),
        "regulatory_suggestions": [
            "Map the retrieved controls to SOC2 CC7 monitoring objectives",
            "Document PDPB lawful basis and retention windows for sensitive datasets",
            "Cross-link each compliance control to a named owner and review cadence",
        ] + list(llm_result.get("regulatory_suggestions", [])),
        "explanation": llm_result.get("summary") or f"Retrieved {matched_controls} control chunks from the FAISS-backed compliance corpus across {len(frameworks)} frameworks.",
        "reasoning": f"Matched {matched_controls} semantically relevant control chunks across {len(frameworks)} frameworks",
        "confidence_notes": llm_result.get("confidence_notes", []),
        "llm_used": llm_used,
    }
