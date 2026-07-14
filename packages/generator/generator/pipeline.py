"""Generation pipeline orchestration."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from generator.affiliate import inject_affiliates
from generator.config import load_prompt, resolve_mode
from generator.groq_client import GroqError, chat_completion
from generator.quality import check_article
from generator.template_articles import build_body, build_outline
from generator.writer import write_article


@dataclass
class RunResult:
    keyword: str
    ok: bool
    output_path: str | None = None
    error: str | None = None


def run_batch(
    *,
    root: Path,
    batch_path: Path,
    out_dir: Path,
    mode: str = "auto",
    count: int | None = None,
) -> list[RunResult]:
    batch = json.loads(batch_path.read_text(encoding="utf-8"))
    items = batch.get("items", [])
    if count is not None:
        items = items[:count]

    resolved = resolve_mode(mode)
    results: list[RunResult] = []

    for item in items:
        keyword = item["keyword"]
        try:
            path = generate_one(root=root, item=item, out_dir=out_dir, mode=resolved)
            results.append(RunResult(keyword=keyword, ok=True, output_path=str(path)))
        except Exception as e:  # noqa: BLE001 — CLI aggregates per-item errors
            results.append(RunResult(keyword=keyword, ok=False, error=str(e)))

    state_path = root / "state/generate-state.json"
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(
        json.dumps(
            {
                "mode": resolved,
                "results": [r.__dict__ for r in results],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return results


def generate_one(*, root: Path, item: dict, out_dir: Path, mode: str) -> Path:
    if mode == "groq":
        outline, body = _generate_groq(root, item)
    else:
        outline = build_outline(item)
        body = build_body(outline)

    body = inject_affiliates(body, root)
    quality = check_article(body, item["articleType"], root, test_mode=True)
    if not quality.ok:
        raise ValueError("; ".join(quality.errors))

    return write_article(out_dir, outline, body, draft=False)


def _generate_groq(root: Path, item: dict) -> tuple[dict, str]:
    outline_prompt = load_prompt(
        root,
        "outline-sim.md",
        {
            "KEYWORD": item["keyword"],
            "ARTICLE_TYPE": item["articleType"],
            "CATEGORY": item["category"],
        },
    )
    try:
        outline_raw = chat_completion(outline_prompt, json_mode=True)
        outline = json.loads(outline_raw)
        outline["keyword"] = item["keyword"]
    except (GroqError, json.JSONDecodeError) as e:
        raise RuntimeError(f"outline generation failed: {e}") from e

    article_prompt_name = {
        "comparison": "article-sim.md",
        "howto": "article-howto.md",
        "troubleshoot": "article-troubleshoot.md",
    }[item["articleType"]]

    article_prompt = load_prompt(
        root,
        article_prompt_name,
        {
            "KEYWORD": item["keyword"],
            "OUTLINE_JSON": json.dumps(outline, ensure_ascii=False),
        },
    )
    try:
        body = chat_completion(article_prompt, json_mode=False)
    except GroqError as e:
        raise RuntimeError(f"article generation failed: {e}") from e

    return outline, body
