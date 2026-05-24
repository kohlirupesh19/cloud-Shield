from typing import Dict, Any
from app.agents.quality_agent import run_quality_agent
from app.agents.security_agent import run_security_agent
from app.agents.governance_agent import run_governance_agent
from app.agents.compliance_agent import run_compliance_agent


def route(payload: Dict[str, Any]) -> str:
    if payload.get("events"):
        return "security"
    if payload.get("policies"):
        return "governance"
    if payload.get("frameworks"):
        return "compliance"
    return "quality"


def execute_workflow(payload: Dict[str, Any]) -> Dict[str, Any]:
    selected = route(payload)
    outputs = {}

    if selected in ("quality",):
        outputs["quality"] = run_quality_agent(payload)
    if selected in ("security",):
        outputs["security"] = run_security_agent(payload)
    if selected in ("governance",):
        outputs["governance"] = run_governance_agent(payload)
    if selected in ("compliance",):
        outputs["compliance"] = run_compliance_agent(payload)

    if payload.get("run_all"):
        outputs = {
            "quality": run_quality_agent(payload),
            "security": run_security_agent(payload),
            "governance": run_governance_agent(payload),
            "compliance": run_compliance_agent(payload),
        }

    return {
        "selected": selected,
        "agents_executed": list(outputs.keys()),
        "results": outputs,
        "metadata": {
            "retry_policy": "up to 2 retries",
            "timeout_seconds": 45,
            "fallback": "return partial results",
            "parallel_support": bool(payload.get("run_all")),
        },
    }
