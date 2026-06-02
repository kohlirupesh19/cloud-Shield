from typing import Any, Dict, List, Optional, TypedDict, Annotated
from langgraph.graph import StateGraph, START, END
import operator

from app.agents.quality_agent import run_quality_agent
from app.agents.security_agent import run_security_agent
from app.agents.governance_agent import run_governance_agent
from app.agents.compliance_agent import run_compliance_agent


def _or_bool(a: bool | None, b: bool | None) -> bool:
    return bool(a or b)


def _extend(a: List[str] | None, b: List[str] | None) -> List[str]:
    return (a or []) + (b or [])


class AnalysisState(TypedDict, total=False):
    payload: Dict[str, Any]
    mode: Optional[str]  # "single" | "combined"
    quality: Optional[Dict[str, Any]]
    security: Optional[Dict[str, Any]]
    governance: Optional[Dict[str, Any]]
    compliance: Optional[Dict[str, Any]]
    errors: Annotated[List[str], _extend]
    llm_used: Annotated[bool, _or_bool]
    agents_executed: Annotated[List[str], _extend]
    results: Dict[str, Any]
    selected: str
    metadata: Dict[str, Any]


def _agent_node(name: str, agent_fn):
    """Wrap agent with per-node simple retry + surface llm_used. Executed list computed in aggregate to avoid parallel write races."""
    def node(state: AnalysisState) -> AnalysisState:
        payload = state.get("payload", {})
        errors: List[str] = list(state.get("errors", []))
        llm_flag = bool(state.get("llm_used", False))

        for attempt in range(2):  # real per-node retry (replaces fabricated)
            try:
                out = agent_fn(payload)
                used = bool(out.get("llm_used"))
                return {
                    name: out,
                    "llm_used": llm_flag or used,
                }
            except Exception as e:
                if attempt == 1:
                    errors.append(f"{name}: {e}")
                    return {"errors": errors}
                # retry on transient
        return {"errors": errors}

    return node


def _route_to_agents(state: AnalysisState) -> List[str]:
    """Conditional entry that supports fan-out for COMBINED."""
    mode = state.get("mode") or state.get("payload", {}).get("mode")
    if mode == "combined" or state.get("payload", {}).get("run_all"):
        return ["quality", "security", "governance", "compliance"]
    p = state.get("payload", {})
    if p.get("events"):
        return ["security"]
    if p.get("policies"):
        return ["governance"]
    if p.get("frameworks"):
        return ["compliance"]
    return ["quality"]


def _aggregate(state: AnalysisState) -> AnalysisState:
    """Join node after potential parallel branches."""
    results: Dict[str, Any] = {}
    for k in ("quality", "security", "governance", "compliance"):
        if state.get(k):
            results[k] = state[k]
    llm = bool(state.get("llm_used", False))
    executed = list(results.keys())
    # Determine selected for backward compat
    mode = state.get("mode") or state.get("payload", {}).get("mode")
    selected = "combined" if (mode == "combined" or len(results) > 1) else (executed[0] if executed else "quality")
    return {
        "results": results,
        "agents_executed": executed,
        "llm_used": llm,
        "selected": selected,
        "metadata": {
            "provider": "langgraph",
            "parallel": len(results) > 1,
            "real_retries": "per-node up to 1",
            "timeouts": "agent-internal (ollama)",
        },
    }


# Build once
_graph = StateGraph(AnalysisState)
_graph.add_node("quality", _agent_node("quality", run_quality_agent))
_graph.add_node("security", _agent_node("security", run_security_agent))
_graph.add_node("governance", _agent_node("governance", run_governance_agent))
_graph.add_node("compliance", _agent_node("compliance", run_compliance_agent))
_graph.add_node("aggregate", _aggregate)

# Conditional fan-out entry (supports COMBINED parallel)
_graph.add_conditional_edges(START, _route_to_agents, ["quality", "security", "governance", "compliance"])

# All branches converge to aggregate
for n in ("quality", "security", "governance", "compliance"):
    _graph.add_edge(n, "aggregate")

_graph.add_edge("aggregate", END)

_app = _graph.compile()


def execute_workflow(payload: Dict[str, Any], mode: Optional[str] = None) -> Dict[str, Any]:
    """Real LangGraph orchestrator entrypoint. mode='combined' runs all 4 in parallel."""
    init: AnalysisState = {
        "payload": payload,
        "mode": mode,
        "errors": [],
        "agents_executed": [],
        "llm_used": False,
    }
    final = _app.invoke(init)
    # Compat shape with old fake (selected, agents_executed, results, metadata)
    return {
        "selected": final.get("selected", "quality"),
        "agents_executed": final.get("agents_executed", []),
        "results": final.get("results", {}),
        "llm_used": final.get("llm_used", False),
        "errors": final.get("errors", []),
        "metadata": final.get("metadata", {"provider": "langgraph"}),
    }
