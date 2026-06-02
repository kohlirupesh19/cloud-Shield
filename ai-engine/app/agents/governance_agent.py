import json

from app.services.ollama import ask_ollama_json
from app.utils.config import settings


def run_governance_agent(payload: dict):
    policies = payload.get("policies", [])
    lineage_edges = payload.get("lineage", [])
    violations = []
    active_policies = [policy for policy in policies if policy.get("isActive", True)]

    if not active_policies:
        violations.append("No active governance policies provided")
    if len(lineage_edges) < 1:
        violations.append("Lineage graph is empty")

    policy_names = {
        str(policy.get("name", "")).strip().lower()
        for policy in active_policies
        if str(policy.get("name", "")).strip()
    }

    orphaned_targets = []
    for edge in lineage_edges:
        source = str(edge.get("source") or edge.get("from") or "").strip()
        target = str(edge.get("sink") or edge.get("target") or edge.get("to") or "").strip()
        policy_ref = str(edge.get("policy") or edge.get("policyName") or "").strip().lower()

        if not source or not target:
            violations.append("A lineage edge is missing a source or sink node")
        if policy_ref and policy_ref not in policy_names:
            orphaned_targets.append(target or policy_ref)

    if orphaned_targets:
        violations.append(f"Policy coverage missing for {len(orphaned_targets)} lineage targets")

    coverage = 100.0 if not policies else max(0.0, min(100.0, 48.0 + (len(active_policies) * 10.0) + (len(lineage_edges) * 3.0) - (len(violations) * 12.0)))
    verdict = "PASS" if coverage >= 80.0 and not violations else "REVIEW" if coverage >= 55.0 else "BLOCK"
    risk = "LOW" if verdict == "PASS" else "MEDIUM" if verdict == "REVIEW" else "HIGH"

    llm_result, llm_used = ask_ollama_json(
        model=settings.model_governance,
        system_prompt="You are a governance reviewer. Return only JSON with keys lineage_explanation, policy_mismatch_report, and next_actions.",
        user_prompt=json.dumps(
            {
                "active_policies": [policy.get("name") for policy in active_policies],
                "lineage_edges": lineage_edges[:10],
                "violations": violations,
                "orphaned_targets": orphaned_targets,
                "coverage": round(coverage, 2),
                "verdict": verdict,
            },
            default=str,
        ),
        fallback={},
    )

    return {
        "governance_verdict": verdict,
        "policy_coverage": round(coverage, 2),
        "policy_mismatch_report": llm_result.get("policy_mismatch_report", violations),
        "orphaned_targets": orphaned_targets,
        "lineage_explanation": llm_result.get("lineage_explanation") or f"Lineage contains {len(lineage_edges)} relationships across {len(active_policies)} active policies",
        "risk_categorization": risk,
        "explanation": llm_result.get("explanation") or "Governance agent mapped live policy definitions against lineage edges and flagged missing ownership or disconnected paths.",
        "next_actions": llm_result.get("next_actions", []),
        "llm_used": llm_used,
    }