"""Fetch and parse official hikari provider price pages (v1)."""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup

DEFAULT_TIMEOUT = 20
MAX_RETRIES = 3
RETRY_BACKOFF_SEC = 2.0
USER_AGENT = "sim-hikari-guide-scraper/1.0 (+https://sim-hikari-guide.com)"

# Official marketing / fee pages (no login).
TARGETS: dict[str, str] = {
    "nuro-hikari": "https://nuro-hikari.com/",
    "au-hikari": "https://www.au.com/internet/",
    "softbank-hikari": "https://www.softbank.jp/internet/",
    "docomo-hikari": "https://www.docomo.ne.jp/internet/hikari/",
}

# Default comparison / campaign slugs to enqueue on price change (rewrite hook).
PROVIDER_REWRITE_SLUGS: dict[str, list[str]] = {
    "nuro-hikari": ["nuro-hikari-au-hikari-hikaku", "nuro-hikari-campaign"],
    "au-hikari": ["nuro-hikari-au-hikari-hikaku", "hikari-mansion-osusume"],
    "softbank-hikari": [
        "softbank-hikari-biglobe-hikari-hikaku",
        "hikari-mansion-osusume",
    ],
    "docomo-hikari": ["hikari-provider-chigai", "hikari-mansion-osusume"],
}

YEN_RE = re.compile(
    r"(?<![\d,.])" r"([1-9]\d{0,2}(?:,\d{3})+|\d{3,6})" r"\s*円"
)
MONTHLY_HINT = re.compile(r"(月額|毎月|月々|月額料金|基本料金)")
CONSTRUCTION_HINT = re.compile(r"(工事費|初期費用|契約事務手数料|工事料金)")
CAMPAIGN_HINT = re.compile(r"(キャンペーン|キャッシュバック|割引|特典)")


@dataclass
class ProviderPrice:
    provider: str
    url: str
    status_code: int
    fetched_at: str
    content_length: int
    ok: bool
    monthlyFeeYen: int | None = None
    constructionFeeYen: int | None = None
    campaignNote: str | None = None
    parseStatus: str = "unparsed"
    error: str | None = None
    rateLimited: bool = False


def repo_root_from_here() -> Path:
    return Path(__file__).resolve().parents[3]


def default_snapshot_path() -> Path:
    return repo_root_from_here() / "data" / "hikari-prices-snapshot.json"


def _parse_yen_candidates(text: str) -> list[int]:
    values: list[int] = []
    for match in YEN_RE.finditer(text):
        raw = match.group(1).replace(",", "")
        try:
            value = int(raw)
        except ValueError:
            continue
        # Plausible monthly / construction fee range for hikari
        if 500 <= value <= 200_000:
            values.append(value)
    return values


def parse_price_html(html: str, *, provider: str) -> dict[str, Any]:
    """Best-effort extract monthly / construction fees and a campaign note."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = soup.get_text("\n", strip=True)

    monthly: int | None = None
    construction: int | None = None
    campaign: str | None = None

    lines = [line for line in text.splitlines() if line]
    for line in lines:
        if monthly is None and MONTHLY_HINT.search(line):
            candidates = _parse_yen_candidates(line)
            if candidates:
                monthly = min(candidates)
        if construction is None and CONSTRUCTION_HINT.search(line):
            if re.search(r"(?<!\d)0\s*円", line):
                construction = 0
            else:
                candidates = _parse_yen_candidates(line)
                if candidates:
                    construction = min(candidates)
        if campaign is None and CAMPAIGN_HINT.search(line):
            yen = _parse_yen_candidates(line)
            note = line[:120]
            if yen:
                campaign = f"{note} (detected yen: {yen[0]})"
            else:
                campaign = note

    if monthly is None and construction is None:
        # Fallback: pick lowest plausible yen near monthly hints in full text
        all_yen = _parse_yen_candidates(text)
        if all_yen:
            monthly = min(all_yen)

    parsed_any = monthly is not None or construction is not None or campaign is not None
    return {
        "monthlyFeeYen": monthly,
        "constructionFeeYen": construction,
        "campaignNote": campaign,
        "parseStatus": "parsed" if parsed_any else "no-price-signals",
        "provider": provider,
    }


def fetch_html(
    url: str,
    *,
    timeout: int = DEFAULT_TIMEOUT,
    session: requests.Session | None = None,
) -> tuple[int, bytes, str | None, bool]:
    """
    GET with retries on 429 / 5xx.
    Returns (status_code, body, error, rate_limited).
    """
    client = session or requests.Session()
    last_error: str | None = None
    rate_limited = False

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.get(
                url,
                timeout=timeout,
                headers={"User-Agent": USER_AGENT, "Accept": "text/html,*/*"},
            )
            if response.status_code == 429:
                rate_limited = True
                last_error = f"HTTP 429 (attempt {attempt}/{MAX_RETRIES})"
                retry_after = response.headers.get("Retry-After")
                wait = RETRY_BACKOFF_SEC * attempt
                if retry_after and retry_after.isdigit():
                    wait = max(wait, float(retry_after))
                if attempt < MAX_RETRIES:
                    time.sleep(wait)
                    continue
                return 429, b"", last_error, True

            if response.status_code >= 500 and attempt < MAX_RETRIES:
                last_error = f"HTTP {response.status_code}"
                time.sleep(RETRY_BACKOFF_SEC * attempt)
                continue

            return (
                response.status_code,
                response.content,
                None if response.ok else f"HTTP {response.status_code}",
                False,
            )
        except requests.RequestException as exc:
            last_error = str(exc)
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BACKOFF_SEC * attempt)
                continue
            return 0, b"", last_error, False

    return 0, b"", last_error or "unknown fetch error", rate_limited


def fetch_and_parse(
    provider: str,
    url: str,
    *,
    html: str | None = None,
    timeout: int = DEFAULT_TIMEOUT,
    session: requests.Session | None = None,
) -> ProviderPrice:
    fetched_at = datetime.now(timezone.utc).isoformat()

    if html is not None:
        parsed = parse_price_html(html, provider=provider)
        return ProviderPrice(
            provider=provider,
            url=url,
            status_code=200,
            fetched_at=fetched_at,
            content_length=len(html.encode("utf-8")),
            ok=True,
            monthlyFeeYen=parsed["monthlyFeeYen"],
            constructionFeeYen=parsed["constructionFeeYen"],
            campaignNote=parsed["campaignNote"],
            parseStatus=parsed["parseStatus"],
            error=None,
            rateLimited=False,
        )

    status, body, error, rate_limited = fetch_html(url, timeout=timeout, session=session)
    if rate_limited or status == 429:
        return ProviderPrice(
            provider=provider,
            url=url,
            status_code=status or 429,
            fetched_at=fetched_at,
            content_length=0,
            ok=False,
            parseStatus="rate-limited",
            error=error or "HTTP 429",
            rateLimited=True,
        )

    if status == 0 or not (200 <= status < 300):
        return ProviderPrice(
            provider=provider,
            url=url,
            status_code=status,
            fetched_at=fetched_at,
            content_length=len(body),
            ok=False,
            parseStatus="fetch-failed",
            error=error,
            rateLimited=False,
        )

    try:
        text = body.decode("utf-8", errors="replace")
    except Exception as exc:  # noqa: BLE001 — keep scrape resilient
        return ProviderPrice(
            provider=provider,
            url=url,
            status_code=status,
            fetched_at=fetched_at,
            content_length=len(body),
            ok=False,
            parseStatus="decode-failed",
            error=str(exc),
        )

    parsed = parse_price_html(text, provider=provider)
    return ProviderPrice(
        provider=provider,
        url=url,
        status_code=status,
        fetched_at=fetched_at,
        content_length=len(body),
        ok=True,
        monthlyFeeYen=parsed["monthlyFeeYen"],
        constructionFeeYen=parsed["constructionFeeYen"],
        campaignNote=parsed["campaignNote"],
        parseStatus=parsed["parseStatus"],
        error=None,
        rateLimited=False,
    )


def load_fixture_html(fixture_dir: Path, provider: str) -> str | None:
    path = fixture_dir / f"{provider}.html"
    if path.is_file():
        return path.read_text(encoding="utf-8")
    return None


def build_snapshot(
    results: list[ProviderPrice],
    *,
    source: str = "live",
) -> dict[str, Any]:
    providers: dict[str, Any] = {}
    for result in results:
        providers[result.provider] = {
            "url": result.url,
            "status_code": result.status_code,
            "fetched_at": result.fetched_at,
            "content_length": result.content_length,
            "ok": result.ok,
            "monthlyFeeYen": result.monthlyFeeYen,
            "constructionFeeYen": result.constructionFeeYen,
            "campaignNote": result.campaignNote,
            "parseStatus": result.parseStatus,
            "error": result.error,
            "rateLimited": result.rateLimited,
            "rewriteSlugs": PROVIDER_REWRITE_SLUGS.get(result.provider, []),
        }

    rate_limited = [r.provider for r in results if r.rateLimited]
    fetch_failed = [r.provider for r in results if not r.ok and not r.rateLimited]

    return {
        "version": "1",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "providers": providers,
        "summary": {
            "total": len(results),
            "ok": sum(1 for r in results if r.ok),
            "rateLimited": rate_limited,
            "fetchFailed": fetch_failed,
        },
    }


def run_snapshot(
    *,
    dry_run: bool = False,
    providers: list[str] | None = None,
    fixture_dir: Path | None = None,
    output: Path | None = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> dict[str, Any]:
    selected = providers or list(TARGETS.keys())
    session = requests.Session()
    results: list[ProviderPrice] = []
    source = "fixture" if fixture_dir else "live"

    for key in selected:
        url = TARGETS[key]
        html = load_fixture_html(fixture_dir, key) if fixture_dir else None
        if fixture_dir and html is None:
            results.append(
                ProviderPrice(
                    provider=key,
                    url=url,
                    status_code=0,
                    fetched_at=datetime.now(timezone.utc).isoformat(),
                    content_length=0,
                    ok=False,
                    parseStatus="fixture-missing",
                    error=f"fixture not found: {fixture_dir / f'{key}.html'}",
                )
            )
            continue
        results.append(
            fetch_and_parse(key, url, html=html, timeout=timeout, session=session)
        )
        if not fixture_dir and key != selected[-1]:
            # Be polite between live requests
            time.sleep(1.0)

    snapshot = build_snapshot(results, source=source)

    if dry_run:
        return snapshot

    out = output or default_snapshot_path()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    snapshot["_writtenTo"] = str(out)
    return snapshot


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Hikari official price page scraper v1")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch/parse and print JSON without writing snapshot file",
    )
    parser.add_argument("--provider", action="append", default=[], help="Limit to provider key(s)")
    parser.add_argument(
        "--fixture-dir",
        type=Path,
        default=None,
        help="Read HTML fixtures instead of live HTTP (for tests / CI)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Snapshot output path (default: data/hikari-prices-snapshot.json)",
    )
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT)
    args = parser.parse_args(argv)

    if args.provider:
        unknown = [key for key in args.provider if key not in TARGETS]
        if unknown:
            print(f"Unknown provider(s): {', '.join(unknown)}", file=sys.stderr)
            return 1

    snapshot = run_snapshot(
        dry_run=args.dry_run,
        providers=args.provider or None,
        fixture_dir=args.fixture_dir,
        output=args.output,
        timeout=args.timeout,
    )
    printable = {k: v for k, v in snapshot.items() if not k.startswith("_")}
    print(json.dumps(printable, ensure_ascii=False, indent=2))

    # Exit codes: 0 = all ok or only rate-limits; 2 = hard fetch/parse failures
    summary = snapshot["summary"]
    if summary["fetchFailed"]:
        return 2
    # Rate limits alone are soft failures (exit 0) so monthly cron does not page
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
