"""Load ASP URL registry and resolve carrier tracking links."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from generator.config import load_json


@lru_cache(maxsize=1)
def load_asp_urls(root: Path) -> dict:
    return load_json(root / "config/asp-urls.json")


def resolve_program_url(root: Path, program_id: str) -> str:
    registry = load_asp_urls(root)
    program = registry.get("programs", {}).get(program_id)
    if not program:
        return "#"
    if program.get("trackingUrl"):
        return program["trackingUrl"]
    return program.get("fallbackUrl", "#")


def resolve_carrier_url(root: Path, carrier: dict) -> str:
    program_id = carrier.get("program")
    if program_id:
        return resolve_program_url(root, program_id)
    return carrier.get("linkTemplate", "#")


def affiliate_host_patterns(root: Path) -> list[str]:
    registry = load_asp_urls(root)
    patterns: list[str] = []
    for provider in registry.get("providers", {}).values():
        if provider.get("status") != "active":
            continue
        host = provider.get("tracking", {}).get("hostPattern")
        if host:
            patterns.append(host)
    return patterns
