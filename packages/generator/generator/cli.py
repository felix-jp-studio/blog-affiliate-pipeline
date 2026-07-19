"""Article generation pipeline CLI."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from generator.pipeline import run_batch
from generator.publish_schedule import run_publish_scheduled


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def generate_main(argv: list[str]) -> int:
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


def publish_scheduled_main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Generate articles on the publish schedule")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Run on a non-scheduled day (still respects same-day and weekly limits)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show planned keywords without generating",
    )
    args = parser.parse_args(argv)

    root = repo_root()
    result = run_publish_scheduled(root=root, force=args.force, dry_run=args.dry_run)

    if result.skipped:
        print(f"[SKIP] {result.reason}")
        return 0

    if args.dry_run:
        print(f"[DRY-RUN] Would generate: {', '.join(result.keywords)}")
        return 0

    for r in result.results:
        status = "OK" if r.ok else "FAIL"
        print(f"[{status}] {r.keyword} -> {r.output_path or r.error}")

    failed = sum(1 for r in result.results if not r.ok)
    return 1 if failed else 0


def main(argv: list[str] | None = None) -> int:
    argv = list(argv if argv is not None else sys.argv[1:])
    if argv and argv[0] == "publish-scheduled":
        return publish_scheduled_main(argv[1:])
    return generate_main(argv)


if __name__ == "__main__":
    raise SystemExit(main())
