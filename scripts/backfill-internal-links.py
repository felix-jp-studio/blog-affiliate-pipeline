#!/usr/bin/env python3
"""Backfill in-body internal links for existing published articles."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages/generator"))

from generator.internal_links import backfill_article_file  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Inject あわせて読みたい sections into existing article markdown files.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report files that would change without writing.",
    )
    args = parser.parse_args()

    articles_dir = ROOT / "site/src/content/articles"
    updated = 0
    skipped = 0

    for path in sorted(articles_dir.glob("*.md")):
        changed = backfill_article_file(path, ROOT, write=not args.dry_run)
        if changed:
            updated += 1
            prefix = "[dry-run] " if args.dry_run else ""
            print(f"{prefix}updated: {path.name}")
        else:
            skipped += 1

    print(f"Updated: {updated}, skipped: {skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
