"""Quality gate for generated articles."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from generator.config import load_json


@dataclass
class QualityResult:
    ok: bool
    errors: list[str]


def check_article(body: str, article_type: str, root: Path, *, test_mode: bool = True) -> QualityResult:
    thresholds = load_json(root / "config/quality-thresholds.json")
    rules = load_json(root / "config/affiliate-rules.json")
    errors: list[str] = []

    min_chars = 3500 if test_mode else thresholds.get("minChars", 4000)
    max_chars = thresholds.get("maxChars", 8000)
    length = len(body)
    if length < min_chars:
        errors.append(f"文字数不足: {length} < {min_chars}")
    if length > max_chars:
        errors.append(f"文字数超過: {length} > {max_chars}")

    for phrase in rules.get("forbiddenPhrases", []):
        if phrase in body:
            errors.append(f"禁止語: {phrase}")

    if "AI" not in body and "AI 支援" not in body:
        errors.append("AI 開示フッターがありません")

    if article_type == "comparison":
        if "|" not in body or "---" not in body:
            errors.append("比較表（Markdown table）がありません")

    if thresholds.get("requireOfficialDateNote") and not re.search(
        r"公式|要確認|2026", body
    ):
        errors.append("公式確認・時点表記がありません")

    if re.search(r"\{\{?AFFILIATE:", body):
        errors.append("未解決のアフィリエイトプレースホルダがあります")

    return QualityResult(ok=len(errors) == 0, errors=errors)
