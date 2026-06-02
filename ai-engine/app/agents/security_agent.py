from sklearn.cluster import DBSCAN
import numpy as np

from app.services.ollama import ask_ollama_json
from app.utils.config import settings
import json


def run_security_agent(payload: dict):
    events = payload.get("events", [])
    if not events:
        return {
            "threat_level": "LOW",
            "risk_score": 0.0,
            "summary": "No events supplied",
            "attack_pattern": "N/A",
            "remediations": ["Send access logs to security agent for UEBA analysis"],
        }

    vectors = np.array([[e.get("hour", 0), e.get("bytes", 0), e.get("failed_logins", 0)] for e in events], dtype=float)
    labels = DBSCAN(eps=3.0, min_samples=3).fit_predict(vectors)
    anomaly_ratio = float((labels == -1).sum() / len(labels))
    risk_score = min(1.0, anomaly_ratio + (sum(e.get("failed_logins", 0) for e in events) / max(1, len(events) * 10)))

    level = "CRITICAL" if risk_score > 0.8 else "HIGH" if risk_score > 0.6 else "MEDIUM" if risk_score > 0.3 else "LOW"
    llm_result, llm_used = ask_ollama_json(
        model=settings.model_security,
        system_prompt="You are a security analyst. Return only JSON with keys summary, attack_pattern, remediations, and confidence_notes.",
        user_prompt=json.dumps(
            {
                "events_count": len(events),
                "anomaly_ratio": round(anomaly_ratio, 4),
                "risk_score": round(risk_score, 4),
                "sample_events": events[:5],
            },
            default=str,
        ),
        fallback={},
    )
    return {
        "threat_level": level,
        "risk_score": round(risk_score, 2),
        "summary": llm_result.get("summary") or f"Detected {int((labels == -1).sum())} anomalous behavioral clusters from {len(events)} events",
        "attack_pattern": llm_result.get("attack_pattern") or "Potential credential abuse and abnormal data access pattern",
        "remediations": [
            "Enforce MFA challenge for high-risk sessions",
            "Throttle high-frequency login failures",
            "Revoke stale API keys with unusual usage",
        ] + list(llm_result.get("remediations", [])),
        "confidence_notes": llm_result.get("confidence_notes", []),
        "llm_used": llm_used,
    }
