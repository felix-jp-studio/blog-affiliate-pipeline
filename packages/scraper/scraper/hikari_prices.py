"""Fetch official hikari provider price pages (skeleton — parse TBD)."""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any

import requests

DEFAULT_TIMEOUT = 20

# Official marketing / fee pages (no login). Parsing deferred to v1.
TARGETS: dict[str, str] = {
    "nuro-hikari": "https://nuro-hikari.com/",
    "au-hikari": "https://www.au.com/internet/",
    "softbank-hikari": "https://www.softbank.jp/internet/",
    "docomo-hikari": "https://www.docomo.ne.jp/internet/hikari/",
}


@dataclass
class FetchResult:
    provider: str
    url: str
    status_code: int
    fetched_at: str
    content_length: int
    ok: bool
    error: str | None = None


def fetch_page(provider: str, url: str, *, timeout: int = DEFAULT_TIMEOUT) -> FetchResult:
    fetched_at = datetime.now(timezone.utc).isoformat()
    try:
        response = requests.get(
            url,
            timeout=timeout,
            headers={"User-Agent": "sim-hikari-guide-scraper/0.1 (+https://sim-hikari-guide.com)"},
        )
        return FetchResult(
            provider=provider,
            url=url,
            status_code=response.status_code,
            fetched_at=fetched_at,
            content_length=len(response.content),
            ok=response.ok,
            error=None if response.ok else f"HTTP {response.status_code}",
        )
    except requests.RequestException as exc:
        return FetchResult(
            provider=provider,
            url=url,
            status_code=0,
            fetched_at=fetched_at,
            content_length=0,
            ok=False,
            error=str(exc),
        )


def run_snapshot(*, dry_run: bool = False) -> dict[str, Any]:
    results = [fetch_page(provider, url) for provider, url in TARGETS.items()]
    snapshot = {
        "version": "0",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "providers": [asdict(result) for result in results],
        "parseStatus": "skeleton-only",
    }

    if dry_run:
        return snapshot

    # v1: write data/hikari-prices-snapshot.json and diff against previous
    return snapshot


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Hikari official price page scraper v0")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and print JSON without writing files")
    parser.add_argument("--provider", action="append", default=[], help="Limit to provider key(s)")
    args = parser.parse_args(argv)

    if args.provider:
        unknown = [key for key in args.provider if key not in TARGETS]
        if unknown:
            print(f"Unknown provider(s): {', '.join(unknown)}", file=sys.stderr)
            return 1

    snapshot = run_snapshot(dry_run=args.dry_run)
    print(json.dumps(snapshot, ensure_ascii=False, indent=2))
    return 0 if all(item["ok"] for item in snapshot["providers"]) else 2


if __name__ == "__main__":
    raise SystemExit(main())
