from app.agents.quality_agent import run_quality_agent


def test_quality_agent_empty():
    out = run_quality_agent({"rows": []})
    assert out["quality_score"] == 0
