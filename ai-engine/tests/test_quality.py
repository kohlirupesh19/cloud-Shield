from app.agents.quality_agent import run_quality_agent


def test_quality_agent_empty():
    out = run_quality_agent({"rows": []})
    assert out["quality_score"] == 0


# Note: envelope tests live in integration or container pytest because routes.py pulls heavy optional deps (faiss/sentence tf etc).
# Logic verified via isolated exec in dev shell.
