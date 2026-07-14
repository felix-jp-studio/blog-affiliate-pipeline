"""Groq API client (OpenAI-compatible)."""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request


class GroqError(Exception):
    pass


def chat_completion(
    prompt: str,
    *,
    json_mode: bool = False,
    model: str | None = None,
    api_key: str | None = None,
) -> str:
    key = api_key or os.environ.get("GROQ_API_KEY")
    if not key:
        raise GroqError("GROQ_API_KEY is not set")

    body: dict = {
        "model": model or os.environ.get("GROQ_MODEL_PROD", "llama-3.3-70b-versatile"),
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.5,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
        },
        method="POST",
    )

    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            content = payload.get("choices", [{}])[0].get("message", {}).get("content")
            if not content:
                raise GroqError("Empty Groq response")
            return content.strip()
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and attempt < 3:
                time.sleep(2**attempt)
                continue
            detail = e.read().decode("utf-8", errors="replace")
            raise GroqError(f"Groq HTTP {e.code}: {detail}") from e

    raise GroqError("Groq request failed after retries")
