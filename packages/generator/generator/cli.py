"""Article generation pipeline CLI."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from generator.pipeline import run_batch


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate test articles for Astro site")
    parser.add_argument(
        "--batch",
        default="config/test-batch.json",
        help="Path to test batch JSON (relative to repo root)",
    )
    parser.add_argument(
        "--mode",
        choices=["auto", "groq", "template"],
        default="auto",
        help="Generation mode (auto: groq if GROQ_API_KEY else template)",
    )
    parser.add_argument(
        "--out",
        default="site/src/content/articles",
        help="Output directory for markdown articles",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=0,
        help="Max articles to generate (0 = all in batch)",
    )
    args = parser.parse_args(argv)

    root = repo_root()
    batch_path = root / args.batch
    if not batch_path.exists():
        print(f"Batch file not found: {batch_path}", file=sys.stderr)
        return 1

    results = run_batch(
        root=root,
        batch_path=batch_path,
        out_dir=root / args.out,
        mode=args.mode,
        count=args.count or None,
    )

    for r in results:
        status = "OK" if r.ok else "FAIL"
        print(f"[{status}] {r.keyword} -> {r.output_path or r.error}")

    failed = sum(1 for r in results if not r.ok)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
