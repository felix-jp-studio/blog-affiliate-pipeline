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
        description="Inject or upgrade あわせて読みたい sections in article markdown files.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report files that would change without writing.",
    )
    parser.add_argument(
        "--upgrade-v1",
        action="store_true",
        help="Replace existing internal-links:v1 sections with cross-entity v2 links.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Rewrite existing v1/v2 sections with the latest link picker.",
    )
    parser.add_argument(
        "--slugs",
        help="Comma-separated slugs to process only (default: all articles).",
    )
    args = parser.parse_args()

    slug_filter: set[str] | None = None
    if args.slugs:
        slug_filter = {slug.strip() for slug in args.slugs.split(",") if slug.strip()}

    articles_dir = ROOT / "site/src/content/articles"
    updated = 0
    skipped = 0

    for path in sorted(articles_dir.glob("*.md")):
        if slug_filter is not None and path.stem not in slug_filter:
            skipped += 1
            continue
        changed = backfill_article_file(
            path,
            ROOT,
            write=not args.dry_run,
            upgrade_v1=args.upgrade_v1,
            force=args.force,
        )
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
