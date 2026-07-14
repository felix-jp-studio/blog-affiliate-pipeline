"""Load repo config and prompts."""

from __future__ import annotations

import json
import os
from pathlib import Path


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_prompt(root: Path, name: str, replacements: dict[str, str]) -> str:
    system = (root / "config/prompts/system-common.md").read_text(encoding="utf-8")
    body = (root / "config/prompts" / name).read_text(encoding="utf-8")
    text = body.replace("{{SYSTEM_COMMON}}", system.strip())
    for key, value in replacements.items():
        text = text.replace(f"{{{{{key}}}}}", value)
    return text


def resolve_mode(requested: str) -> str:
    if requested == "auto":
        return "groq" if os.environ.get("GROQ_API_KEY") else "template"
    return requested


def groq_model() -> str:
    return os.environ.get("GROQ_MODEL_PROD", "llama-3.3-70b-versatile")
