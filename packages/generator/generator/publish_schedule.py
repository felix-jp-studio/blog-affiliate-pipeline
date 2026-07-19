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


def pick_next_keywords(
    *,
    seed_rows: list[dict],
    published_slugs: set[str],
    count: int,
) -> list[dict]:
    picked: list[dict] = []
    for row in seed_rows:
        slug = slugify(row["keyword"], priority=row["priority"])
        assert_seo_slug(slug, keyword=row["keyword"])
        if slug in published_slugs:
            continue
        picked.append(seed_row_to_item(row))
        if len(picked) >= count:
            break
    return picked


def iso_week_id(day: date) -> str:
    year, week, _ = day.isocalendar()
    return f"{year}-W{week:02d}"


def weekday_name(day: date) -> str:
    return day.strftime("%A").lower()


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


def load_queue_state(path: Path) -> dict:
    if not path.exists():
        return {
            "last_run": None,
            "next_scheduled": None,
            "week_id": None,
            "runs_this_week": 0,
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
) -> dict:
    week_id = iso_week_id(run_date)
    runs_this_week = queue_state.get("runs_this_week", 0)
    if queue_state.get("week_id") != week_id:
        runs_this_week = 0

    if ok_count > 0:
        runs_this_week += 1

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

    seed_path = root / schedule["keywords_seed"]
    articles_dir = root / schedule["output_dir"]
    published_slugs = get_published_slugs(articles_dir)
    seed_rows = load_keywords_seed(seed_path)

    count = schedule["articles_per_run"]
    items = pick_next_keywords(
        seed_rows=seed_rows,
        published_slugs=published_slugs,
        count=count,
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

    ok_count = sum(1 for r in results if r.ok)
    if ok_count > 0:
        queue_state = update_queue_after_run(
            schedule=schedule,
            queue_state=queue_state,
            run_date=decision.run_date,
            keywords=keywords,
            ok_count=ok_count,
        )
        save_queue_state(queue_path, queue_state)

    return PublishScheduledResult(
        skipped=False,
        reason="completed" if ok_count else "all failed",
        keywords=keywords,
        results=results,
        queue_state=queue_state,
    )
