"""Affiliate placeholder injection."""

from __future__ import annotations

import json
import re
from pathlib import Path


def inject_affiliates(body: str, root: Path) -> str:
    rules_path = root / "config/affiliate-rules.json"
    rules = json.loads(rules_path.read_text(encoding="utf-8"))
    carriers = rules.get("carriers", {})

    def repl(match: re.Match[str]) -> str:
        carrier_id = match.group(1)
        carrier = carriers.get(carrier_id)
        if not carrier:
            return match.group(0)
        return carrier.get("linkTemplate", "#")

    body = re.sub(r"\{\{AFFILIATE:([a-z0-9-]+)\}\}", repl, body)
    return re.sub(r"\{AFFILIATE:([a-z0-9-]+)\}", repl, body)
