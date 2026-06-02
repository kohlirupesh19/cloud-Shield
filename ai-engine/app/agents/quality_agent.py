import json

from sklearn.ensemble import IsolationForest
import pandas as pd
import numpy as np

from app.services.ollama import ask_ollama_json
from app.utils.config import settings


def run_quality_agent(payload: dict):
    rows = payload.get("rows", [])
    df = pd.DataFrame(rows)
    if df.empty:
        return {
            "quality_score": 0,
            "anomaly_score": 0,
            "issues": ["No data rows provided"],
            "explanation": "Quality analysis could not run because dataset was empty.",
            "recommendations": ["Upload CSV or JSON rows to run quality checks"],
        }

    missing_ratio = float(df.isna().mean().mean())
    duplicates = int(df.duplicated().sum())
    numeric_df = df.select_dtypes(include=[np.number])
    anomaly_score = 0.0
    if not numeric_df.empty and len(numeric_df) > 5:
        model = IsolationForest(contamination="auto", random_state=42)
        model.fit(numeric_df.fillna(0))
        raw_anomaly_scores = -model.score_samples(numeric_df.fillna(0))
        anomalous_points = int((raw_anomaly_scores > 0.58).sum())
        anomaly_score = float(anomalous_points / len(raw_anomaly_scores))

    quality_score = max(0.0, 100.0 - (missing_ratio * 60) - min(duplicates, 100) * 0.2 - anomaly_score * 120)
    llm_result, llm_used = ask_ollama_json(
        model=settings.model_quality,
        system_prompt="You are a data quality analyst. Return only JSON with keys summary, issues, recommendations, and confidence_notes.",
        user_prompt=json.dumps(
            {
                "missing_ratio": round(missing_ratio, 4),
                "duplicates": duplicates,
                "anomaly_score": round(anomaly_score, 4),
                "row_sample": df.head(5).to_dict(orient="records"),
            },
            default=str,
        ),
        fallback={},
    )

    issues = [
        f"Missing ratio: {missing_ratio:.2%}",
        f"Duplicate rows: {duplicates}",
    ]
    if anomaly_score > 0.15:
        issues.append(f"CRITICAL: Extreme anomaly rate detected ({anomaly_score:.1%}). Dataset contains high levels of noise or potential fraud/threat markers.")
    elif anomaly_score > 0.05:
        issues.append(f"WARNING: Elevated anomaly rate detected ({anomaly_score:.1%}). Statistical distribution contains notable outliers.")

    return {
        "quality_score": round(quality_score, 2),
        "anomaly_score": round(anomaly_score, 3),
        "issues": issues + list(llm_result.get("issues", [])),
        "explanation": llm_result.get("summary") or "Quality agent evaluated completeness, duplicates, and statistical outliers using IsolationForest.",
        "recommendations": [
            "Impute critical null fields before training or reporting",
            "Deduplicate using primary keys and deterministic merge rules",
            "Investigate outlier clusters for schema drift",
        ] + list(llm_result.get("recommendations", [])),
        "confidence_notes": llm_result.get("confidence_notes", []),
        "llm_used": llm_used,
    }
