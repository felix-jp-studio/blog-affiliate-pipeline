#!/usr/bin/env python3
"""Backfill title/description frontmatter using PR #84 meta templates."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages/generator"))

from generator.backfill_meta import backfill_meta_file  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Backfill title/description using meta title templates v1.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report files that would change without writing.",
    )
    parser.add_argument(
        "--slug",
        action="append",
        default=[],
        help="Limit to specific slug(s). Repeatable.",
    )
    args = parser.parse_args()

    articles_dir = ROOT / "site/src/content/articles"
    paths = sorted(articles_dir.glob("*.md"))
    if args.slug:
        allowed = set(args.slug)
        paths = [path for path in paths if path.stem in allowed]

    updated = 0
    skipped = 0
    for path in paths:
        changed = backfill_meta_file(path, write=not args.dry_run)
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
