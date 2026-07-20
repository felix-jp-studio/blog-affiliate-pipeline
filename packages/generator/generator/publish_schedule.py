"""Scheduled article publishing queue logic."""

from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from generator.config import load_json
from generator.pipeline import RunResult, generate_one, resolve_mode
from generator.template_articles import assert_seo_slug, slugify

DAY_NAMES = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}

HIKARI_HINTS = (
    "光",
    "NURO",
    "WiMAX",
    "au ひかり",
    "auひかり",
    "ドコモ光",
    "ソフトバンク光",
    "ビッグローブ光",
    "光コラボ",
    "プロバイダ",
    "モバレコ",
    "ホームルーター",
)


@dataclass
class ScheduleDecision:
    due: bool
    reason: str
    run_date: date


@dataclass
class PublishScheduledResult:
    skipped: bool
    reason: str
    keywords: list[str]
    results: list[RunResult]
    queue_state: dict


def infer_category(keyword: str, article_type: str) -> str:
    if article_type == "crosssell":
        return "cost"
    if article_type == "troubleshoot":
        return "trouble"
    if any(hint in keyword for hint in HIKARI_HINTS):
        return "hikari"
    return "sim"


def load_keywords_seed(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(
                {
                    "keyword": row["keyword"].strip(),
                    "articleType": row["article_type"].strip(),
                    "priority": int(row["priority"]),
                }
            )
    rows.sort(key=lambda item: item["priority"])
    return rows


def seed_row_to_item(row: dict) -> dict:
    return {
        "keyword": row["keyword"],
        "articleType": row["articleType"],
        "category": infer_category(row["keyword"], row["articleType"]),
        "priority": row["priority"],
    }


def get_published_slugs(articles_dir: Path) -> set[str]:
    if not articles_dir.exists():
        return set()
    return {path.stem for path in articles_dir.glob("*.md")}


def build_type_sequence(type_order: list[str], quota: dict[str, int]) -> list[str]:
    """Interleave the weekly quota round-robin over ``type_order``.

    Example: order ``[comparison, howto, troubleshoot]`` with quota 2 each yields
    ``[comparison, howto, troubleshoot, comparison, howto, troubleshoot]``.
    """
    remaining = {t: int(quota.get(t, 0)) for t in type_order}
    seq: list[str] = []
    while any(v > 0 for v in remaining.values()):
        for t in type_order:
            if remaining[t] > 0:
                seq.append(t)
                remaining[t] -= 1
    return seq


def next_needed_type(
    type_counts: dict[str, int],
    type_order: list[str],
    quota: dict[str, int],
) -> str | None:
    """Return the article type that should fill the next weekly slot.

    Walks the interleaved sequence and consumes one credit per already-published
    article of each type. The first slot whose type has no remaining credit is the
    next needed type. Returns ``None`` when the weekly quota is fully met. Extra
    articles of one type (from an earlier fallback) simply shift demand toward the
    types that are still short.
    """
    seq = build_type_sequence(type_order, quota)
    credits = {t: int(type_counts.get(t, 0)) for t in type_order}
    for t in seq:
        if credits.get(t, 0) > 0:
            credits[t] -= 1
        else:
            return t
    return None


def _preferred_types(
    needed: str | None,
    type_counts: dict[str, int],
    type_order: list[str],
    quota: dict[str, int],
) -> list[str]:
    """Ordered list of types to try, most-wanted first.

    1. The next needed type. 2. Other types still under their weekly quota
    (in ``type_order``). 3. Any remaining type as a last-resort fallback.
    """
    order: list[str] = []
    if needed:
        order.append(needed)
    for t in type_order:
        if t not in order and int(type_counts.get(t, 0)) < int(quota.get(t, 0)):
            order.append(t)
    for t in type_order:
        if t not in order:
            order.append(t)
    return order


def _pick_one_of_type(
    seed_rows: list[dict],
    published_slugs: set[str],
    used_slugs: set[str],
    article_type: str | None,
) -> dict | None:
    for row in seed_rows:
        if article_type is not None and row["articleType"] != article_type:
            continue
        slug = slugify(row["keyword"], priority=row["priority"])
        assert_seo_slug(slug, keyword=row["keyword"])
        if slug in published_slugs or slug in used_slugs:
            continue
        return seed_row_to_item(row)
    return None


def pick_next_keywords(
    *,
    seed_rows: list[dict],
    published_slugs: set[str],
    count: int,
    type_counts: dict[str, int] | None = None,
    type_order: list[str] | None = None,
    weekly_type_quota: dict[str, int] | None = None,
    article_type_filter: str | None = None,
) -> list[dict]:
    """Pick the next ``count`` keywords by priority.

    When ``type_order`` and ``weekly_type_quota`` are provided, selection is
    balanced across article types: each pick targets the next needed type and only
    falls back to other types when the seed has no unpublished keyword of that type
    left. Without those arguments it degrades to pure priority order.

    When ``article_type_filter`` is set (Sunday crosssell runs), only keywords of
    that type are considered, in priority order.
    """
    if article_type_filter:
        filtered_rows = [
            row for row in seed_rows if row["articleType"] == article_type_filter
        ]
        return pick_next_keywords(
            seed_rows=filtered_rows,
            published_slugs=published_slugs,
            count=count,
        )

    balanced = bool(type_order and weekly_type_quota)
    counts = {t: int((type_counts or {}).get(t, 0)) for t in (type_order or [])}
    picked: list[dict] = []
    used_slugs: set[str] = set()

    for _ in range(count):
        item: dict | None = None
        if balanced:
            needed = next_needed_type(counts, type_order, weekly_type_quota)
            for candidate_type in _preferred_types(
                needed, counts, type_order, weekly_type_quota
            ):
                item = _pick_one_of_type(seed_rows, published_slugs, used_slugs, candidate_type)
                if item is not None:
                    break
        if item is None:
            item = _pick_one_of_type(seed_rows, published_slugs, used_slugs, None)
        if item is None:
            break

        picked.append(item)
        used_slugs.add(slugify(item["keyword"], priority=item["priority"]))
        if balanced:
            counts[item["articleType"]] = counts.get(item["articleType"], 0) + 1

    return picked


def iso_week_id(day: date) -> str:
    year, week, _ = day.isocalendar()
    return f"{year}-W{week:02d}"


def weekday_name(day: date) -> str:
    return day.strftime("%A").lower()


def is_sunday(day: date) -> bool:
    return day.weekday() == DAY_NAMES["sunday"]


@dataclass
class RunProfile:
    seed_rel: str
    type_order: list[str] | None
    weekly_type_quota: dict[str, int] | None
    article_type_filter: str | None


def resolve_run_profile(schedule: dict, run_date: date) -> RunProfile:
    """Return keyword source and selection rules for the given run day."""
    if is_sunday(run_date):
        return RunProfile(
            seed_rel=schedule.get("sunday_keywords_seed", "data/keywords.sunday.csv"),
            type_order=None,
            weekly_type_quota=None,
            article_type_filter=schedule.get("sunday_type", "crosssell"),
        )
    return RunProfile(
        seed_rel=schedule["keywords_seed"],
        type_order=schedule.get("type_order"),
        weekly_type_quota=schedule.get("weekly_type_quota"),
        article_type_filter=None,
    )


def is_scheduled_day(schedule: dict, day: date) -> bool:
    allowed = {DAY_NAMES[name.lower()] for name in schedule["days"]}
    return day.weekday() in allowed


def compute_next_scheduled(schedule: dict, *, from_day: date) -> date:
    for offset in range(1, 15):
        candidate = from_day + timedelta(days=offset)
        if is_scheduled_day(schedule, candidate):
            return candidate
    raise ValueError("No scheduled day found within 14 days")


def is_due_today(
    schedule: dict,
    *,
    now: datetime,
    queue_state: dict,
    ignore_schedule_day: bool = False,
) -> ScheduleDecision:
    tz = ZoneInfo(schedule["timezone"])
    today = now.astimezone(tz).date()

    if queue_state.get("last_run") == today.isoformat():
        return ScheduleDecision(False, "already ran today", today)

    week_id = iso_week_id(today)
    runs_this_week = queue_state.get("runs_this_week", 0)
    if queue_state.get("week_id") == week_id and runs_this_week >= schedule["max_per_week"]:
        return ScheduleDecision(False, "weekly limit reached", today)

    if (
        schedule["mode"] == "weekly"
        and not ignore_schedule_day
        and not is_scheduled_day(schedule, today)
    ):
        return ScheduleDecision(False, f"not a scheduled day ({weekday_name(today)})", today)

    return ScheduleDecision(True, "due", today)


def reconstruct_week_type_counts(
    *,
    queue_state: dict,
    seed_rows: list[dict],
    week_id: str,
) -> dict[str, int]:
    """Best-effort rebuild of this week's per-type counts from history.

    Migrates a queue state written by an older version that tracked
    ``runs_this_week`` without ``type_counts`` so the interleaved rotation keeps its
    place instead of restarting from the first type mid-week.
    """
    type_by_keyword = {row["keyword"]: row["articleType"] for row in seed_rows}
    counts: dict[str, int] = {}
    for entry in queue_state.get("history", []):
        if entry.get("ok_count", 0) <= 0:
            continue
        try:
            entry_date = date.fromisoformat(entry.get("date", ""))
        except ValueError:
            continue
        if iso_week_id(entry_date) != week_id:
            continue
        for keyword in entry.get("keywords", []):
            article_type = type_by_keyword.get(keyword)
            if article_type:
                counts[article_type] = counts.get(article_type, 0) + 1
    return counts


def load_queue_state(path: Path) -> dict:
    if not path.exists():
        return {
            "last_run": None,
            "next_scheduled": None,
            "week_id": None,
            "runs_this_week": 0,
            "type_counts": {},
            "history": [],
        }
    return json.loads(path.read_text(encoding="utf-8"))


def save_queue_state(path: Path, state: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_queue_after_run(
    *,
    schedule: dict,
    queue_state: dict,
    run_date: date,
    keywords: list[str],
    ok_count: int,
    ok_types: list[str] | None = None,
) -> dict:
    week_id = iso_week_id(run_date)
    runs_this_week = queue_state.get("runs_this_week", 0)
    type_counts = dict(queue_state.get("type_counts", {}))
    if queue_state.get("week_id") != week_id:
        runs_this_week = 0
        type_counts = {}

    runs_this_week += ok_count
    for article_type in ok_types or []:
        type_counts[article_type] = type_counts.get(article_type, 0) + 1

    history = list(queue_state.get("history", []))
    history.append(
        {
            "date": run_date.isoformat(),
            "keywords": keywords,
            "ok_count": ok_count,
        }
    )

    return {
        "last_run": run_date.isoformat(),
        "next_scheduled": compute_next_scheduled(schedule, from_day=run_date).isoformat(),
        "week_id": week_id,
        "runs_this_week": runs_this_week,
        "type_counts": type_counts,
        "history": history[-52:],
    }


def run_publish_scheduled(
    *,
    root: Path,
    schedule_path: Path | None = None,
    queue_path: Path | None = None,
    force: bool = False,
    dry_run: bool = False,
    now: datetime | None = None,
) -> PublishScheduledResult:
    schedule_path = schedule_path or root / "config/publish-schedule.json"
    queue_path = queue_path or root / "state/publish-queue.json"

    schedule = load_json(schedule_path)
    queue_state = load_queue_state(queue_path)
    tz = ZoneInfo(schedule["timezone"])
    current = now or datetime.now(tz)

    decision = is_due_today(
        schedule,
        now=current,
        queue_state=queue_state,
        ignore_schedule_day=force,
    )
    if not decision.due:
        return PublishScheduledResult(
            skipped=True,
            reason=decision.reason,
            keywords=[],
            results=[],
            queue_state=queue_state,
        )

    profile = resolve_run_profile(schedule, decision.run_date)

    seed_path = root / profile.seed_rel
    articles_dir = root / schedule["output_dir"]
    published_slugs = get_published_slugs(articles_dir)
    seed_rows = load_keywords_seed(seed_path)

    count = schedule["articles_per_run"]
    type_order = profile.type_order
    weekly_type_quota = profile.weekly_type_quota

    week_id = iso_week_id(decision.run_date)
    if is_sunday(decision.run_date):
        type_counts: dict[str, int] = {}
    elif queue_state.get("week_id") == week_id:
        type_counts = dict(queue_state.get("type_counts") or {})
        if not type_counts and queue_state.get("runs_this_week", 0) > 0:
            type_counts = reconstruct_week_type_counts(
                queue_state=queue_state, seed_rows=seed_rows, week_id=week_id
            )
    else:
        type_counts = {}

    items = pick_next_keywords(
        seed_rows=seed_rows,
        published_slugs=published_slugs,
        count=count,
        type_counts=type_counts,
        type_order=type_order,
        weekly_type_quota=weekly_type_quota,
        article_type_filter=profile.article_type_filter,
    )
    if not items:
        return PublishScheduledResult(
            skipped=True,
            reason="no unpublished keywords remaining",
            keywords=[],
            results=[],
            queue_state=queue_state,
        )

    keywords = [item["keyword"] for item in items]
    if dry_run:
        return PublishScheduledResult(
            skipped=False,
            reason="dry-run",
            keywords=keywords,
            results=[],
            queue_state=queue_state,
        )

    mode = resolve_mode(schedule.get("generation_mode", "auto"))
    results: list[RunResult] = []
    for item in items:
        keyword = item["keyword"]
        try:
            path = generate_one(root=root, item=item, out_dir=articles_dir, mode=mode)
            results.append(RunResult(keyword=keyword, ok=True, output_path=str(path)))
            published_slugs.add(path.stem)
        except Exception as e:  # noqa: BLE001 — aggregate per-item errors
            results.append(RunResult(keyword=keyword, ok=False, error=str(e)))

    ok_types = [item["articleType"] for item, r in zip(items, results) if r.ok]
    ok_count = len(ok_types)
    if ok_count > 0:
        queue_state = update_queue_after_run(
            schedule=schedule,
            queue_state=queue_state,
            run_date=decision.run_date,
            keywords=keywords,
            ok_count=ok_count,
            ok_types=ok_types,
        )
        save_queue_state(queue_path, queue_state)

    return PublishScheduledResult(
        skipped=False,
        reason="completed" if ok_count else "all failed",
        keywords=keywords,
        results=results,
        queue_state=queue_state,
    )
