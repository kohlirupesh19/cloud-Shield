import json
from typing import Any, Optional

import httpx

from app.utils.config import settings


def _extract_json(text: str) -> dict[str, Any]:
    stripped = text.strip()
    if not stripped:
        return {}

    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        if stripped.startswith("json"):
            stripped = stripped[4:].strip()

    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(stripped[start : end + 1])
            except json.JSONDecodeError:
                return {}
        return {}


def ask_ollama_json(
    *,
    model: str,
    system_prompt: str,
    user_prompt: str,
    fallback: Optional[dict[str, Any]] = None,
) -> tuple[dict[str, Any], bool]:
    """Returns (parsed_or_fallback, llm_used). llm_used=False on disabled, parse fail, or exception."""
    if not settings.ollama_enabled:
        return (fallback or {}, False)

    url = settings.ollama_base_url.rstrip("/") + "/api/chat"
    payload = {
        "model": model,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "options": {
            "temperature": 0.15,
            "top_p": 0.9,
            "num_ctx": 2048,
        },
    }

    try:
        with httpx.Client(timeout=settings.ollama_timeout_seconds) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            content = response.json().get("message", {}).get("content", "")
            parsed = _extract_json(content)
            if parsed:
                return (parsed, True)
            return (fallback or {}, False)
    except Exception:
        return (fallback or {}, False)
