import json
import tempfile
import unittest
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from generator.publish_schedule import (
    build_type_sequence,
    compute_next_scheduled,
    infer_category,
    is_due_today,
    load_keywords_seed,
    next_needed_type,
    pick_next_keywords,
    reconstruct_week_type_counts,
    run_publish_scheduled,
    seed_row_to_item,
    update_queue_after_run,
)
from generator.template_articles import assert_seo_slug, slugify

ROOT = Path(__file__).resolve().parents[3]
TYPE_ORDER = ["comparison", "howto", "troubleshoot"]
WEEKLY_TYPE_QUOTA = {"comparison": 2, "howto": 2, "troubleshoot": 2}
SCHEDULE = {
    "mode": "weekly",
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    "articles_per_run": 1,
    "timezone": "Asia/Tokyo",
    "max_per_week": 6,
    "weekly_type_quota": WEEKLY_TYPE_QUOTA,
    "type_order": TYPE_ORDER,
    "generation_mode": "template",
    "keywords_seed": "data/keywords.seed.csv",
    "output_dir": "site/src/content/articles",
}


class PublishScheduleTest(unittest.TestCase):
    def test_infer_category(self):
        self.assertEqual(infer_category("格安SIM 20GB おすすめ", "comparison"), "sim")
        self.assertEqual(infer_category("NURO 光 料金 キャンペーン", "comparison"), "hikari")
        self.assertEqual(infer_category("格安SIM 速度 遅い 対処", "troubleshoot"), "trouble")

    def test_pick_next_keywords_skips_published(self):
        seed_rows = load_keywords_seed(ROOT / "data/keywords.seed.csv")
        published = {slugify("格安SIM 20GB おすすめ"), slugify("楽天モバイル 乗り換え 手順")}
        picked = pick_next_keywords(seed_rows=seed_rows, published_slugs=published, count=2)
        self.assertEqual(len(picked), 2)
        self.assertEqual(picked[0]["keyword"], "MNP 予約番号 取得方法")
        self.assertEqual(picked[0]["priority"], 3)

    def test_is_due_today_on_monday(self):
        monday = datetime(2026, 7, 20, 9, 0, tzinfo=ZoneInfo("Asia/Tokyo"))
        decision = is_due_today(SCHEDULE, now=monday, queue_state={})
        self.assertTrue(decision.due)

    def test_is_due_today_on_saturday(self):
        saturday = datetime(2026, 7, 25, 9, 0, tzinfo=ZoneInfo("Asia/Tokyo"))
        decision = is_due_today(SCHEDULE, now=saturday, queue_state={})
        self.assertTrue(decision.due)

    def test_is_due_today_skips_sunday(self):
        sunday = datetime(2026, 7, 26, 9, 0, tzinfo=ZoneInfo("Asia/Tokyo"))
        decision = is_due_today(SCHEDULE, now=sunday, queue_state={})
        self.assertFalse(decision.due)
        self.assertIn("not a scheduled day", decision.reason)

    def test_is_due_today_idempotent_same_day(self):
        monday = datetime(2026, 7, 20, 9, 0, tzinfo=ZoneInfo("Asia/Tokyo"))
        queue_state = {"last_run": "2026-07-20"}
        decision = is_due_today(SCHEDULE, now=monday, queue_state=queue_state)
        self.assertFalse(decision.due)
        self.assertEqual(decision.reason, "already ran today")

    def test_is_due_today_weekly_limit(self):
        monday = datetime(2026, 7, 20, 9, 0, tzinfo=ZoneInfo("Asia/Tokyo"))
        queue_state = {"week_id": "2026-W30", "runs_this_week": 6}
        decision = is_due_today(SCHEDULE, now=monday, queue_state=queue_state)
        self.assertFalse(decision.due)
        self.assertEqual(decision.reason, "weekly limit reached")

    def test_compute_next_scheduled_from_monday(self):
        monday = date(2026, 7, 20)
        self.assertEqual(compute_next_scheduled(SCHEDULE, from_day=monday), date(2026, 7, 21))

    def test_compute_next_scheduled_from_saturday_skips_sunday(self):
        saturday = date(2026, 7, 25)
        self.assertEqual(compute_next_scheduled(SCHEDULE, from_day=saturday), date(2026, 7, 27))

    def test_seed_row_to_item_maps_article_type(self):
        item = seed_row_to_item(
            {"keyword": "MNP 予約番号 取得方法", "articleType": "howto", "priority": 3}
        )
        self.assertEqual(item["articleType"], "howto")
        self.assertEqual(item["category"], "sim")

    def test_slugify_romanizes_japanese_keyword(self):
        self.assertEqual(slugify("光回線 マンション おすすめ", priority=16), "hikari-mansion-osusume")

    def test_slugify_rejects_generic_priority_fallback(self):
        with self.assertRaises(ValueError):
            slugify("", priority=99)

    def test_slugify_future_keyword_from_tokens(self):
        self.assertEqual(slugify("工事 不要 光回線", priority=17), "kouji-fuyou-hikari")

    def test_slugify_raises_for_unmapped_tokens(self):
        with self.assertRaises(ValueError):
            slugify("未登録語 テスト キーワード", priority=99)

    def test_force_still_respects_same_day_guard(self):
        monday = datetime(2026, 7, 20, 9, 0, tzinfo=ZoneInfo("Asia/Tokyo"))
        queue_state = {"last_run": "2026-07-20"}
        decision = is_due_today(
            SCHEDULE,
            now=monday,
            queue_state=queue_state,
            ignore_schedule_day=True,
        )
        self.assertFalse(decision.due)
        self.assertEqual(decision.reason, "already ran today")

    def test_build_type_sequence_interleaves(self):
        seq = build_type_sequence(TYPE_ORDER, WEEKLY_TYPE_QUOTA)
        self.assertEqual(
            seq,
            ["comparison", "howto", "troubleshoot", "comparison", "howto", "troubleshoot"],
        )

    def test_next_needed_type_walks_week(self):
        # Empty week -> first slot is comparison, then howto, then troubleshoot.
        self.assertEqual(next_needed_type({}, TYPE_ORDER, WEEKLY_TYPE_QUOTA), "comparison")
        self.assertEqual(
            next_needed_type({"comparison": 1}, TYPE_ORDER, WEEKLY_TYPE_QUOTA), "howto"
        )
        self.assertEqual(
            next_needed_type(
                {"comparison": 1, "howto": 1}, TYPE_ORDER, WEEKLY_TYPE_QUOTA
            ),
            "troubleshoot",
        )
        self.assertEqual(
            next_needed_type(
                {"comparison": 1, "howto": 1, "troubleshoot": 1},
                TYPE_ORDER,
                WEEKLY_TYPE_QUOTA,
            ),
            "comparison",
        )

    def test_next_needed_type_none_when_quota_full(self):
        full = {"comparison": 2, "howto": 2, "troubleshoot": 2}
        self.assertIsNone(next_needed_type(full, TYPE_ORDER, WEEKLY_TYPE_QUOTA))

    def test_next_needed_type_shifts_after_fallback(self):
        # An extra comparison (from a fallback) shifts demand to the short types.
        counts = {"comparison": 2, "howto": 0, "troubleshoot": 0}
        self.assertEqual(next_needed_type(counts, TYPE_ORDER, WEEKLY_TYPE_QUOTA), "howto")

    def test_pick_next_keywords_balanced_targets_needed_type(self):
        seed_rows = load_keywords_seed(ROOT / "data/keywords.seed.csv")
        # One comparison already published this week -> next pick should be howto.
        picked = pick_next_keywords(
            seed_rows=seed_rows,
            published_slugs=set(),
            count=1,
            type_counts={"comparison": 1},
            type_order=TYPE_ORDER,
            weekly_type_quota=WEEKLY_TYPE_QUOTA,
        )
        self.assertEqual(len(picked), 1)
        self.assertEqual(picked[0]["articleType"], "howto")

    def test_pick_next_keywords_balanced_full_week_interleaved(self):
        seed_rows = load_keywords_seed(ROOT / "data/keywords.seed.csv")
        picked = pick_next_keywords(
            seed_rows=seed_rows,
            published_slugs=set(),
            count=6,
            type_counts={},
            type_order=TYPE_ORDER,
            weekly_type_quota=WEEKLY_TYPE_QUOTA,
        )
        types = [item["articleType"] for item in picked]
        self.assertEqual(
            types,
            ["comparison", "howto", "troubleshoot", "comparison", "howto", "troubleshoot"],
        )
        # Exactly the weekly quota per type.
        self.assertEqual(types.count("comparison"), 2)
        self.assertEqual(types.count("howto"), 2)
        self.assertEqual(types.count("troubleshoot"), 2)

    def test_pick_next_keywords_falls_back_when_type_exhausted(self):
        # Only comparison keywords exist; a needed howto slot falls back to comparison.
        seed_rows = [
            {"keyword": "格安SIM 20GB おすすめ", "articleType": "comparison", "priority": 1},
            {"keyword": "LINEMO 評判 デメリット", "articleType": "comparison", "priority": 5},
        ]
        picked = pick_next_keywords(
            seed_rows=seed_rows,
            published_slugs=set(),
            count=1,
            type_counts={"comparison": 1},
            type_order=TYPE_ORDER,
            weekly_type_quota=WEEKLY_TYPE_QUOTA,
        )
        self.assertEqual(len(picked), 1)
        self.assertEqual(picked[0]["articleType"], "comparison")

    def test_pick_next_keywords_without_type_args_is_priority_order(self):
        seed_rows = load_keywords_seed(ROOT / "data/keywords.seed.csv")
        picked = pick_next_keywords(seed_rows=seed_rows, published_slugs=set(), count=1)
        self.assertEqual(picked[0]["priority"], 1)

    def test_update_queue_after_run_tracks_type_counts(self):
        state = update_queue_after_run(
            schedule=SCHEDULE,
            queue_state={"week_id": "2026-W30", "runs_this_week": 1, "type_counts": {"comparison": 1}},
            run_date=date(2026, 7, 21),
            keywords=["楽天モバイル 乗り換え 手順"],
            ok_count=1,
            ok_types=["howto"],
        )
        self.assertEqual(state["runs_this_week"], 2)
        self.assertEqual(state["type_counts"], {"comparison": 1, "howto": 1})

    def test_update_queue_after_run_resets_type_counts_on_new_week(self):
        state = update_queue_after_run(
            schedule=SCHEDULE,
            queue_state={
                "week_id": "2026-W29",
                "runs_this_week": 6,
                "type_counts": {"comparison": 2, "howto": 2, "troubleshoot": 2},
            },
            run_date=date(2026, 7, 20),
            keywords=["格安SIM おすすめ 比較 2026"],
            ok_count=1,
            ok_types=["comparison"],
        )
        self.assertEqual(state["week_id"], "2026-W30")
        self.assertEqual(state["runs_this_week"], 1)
        self.assertEqual(state["type_counts"], {"comparison": 1})

    def test_reconstruct_week_type_counts_from_history(self):
        seed_rows = load_keywords_seed(ROOT / "data/keywords.seed.csv")
        # Old-format state: runs_this_week set, but no type_counts field.
        queue_state = {
            "week_id": "2026-W30",
            "runs_this_week": 2,
            "history": [
                {"date": "2026-07-20", "keywords": ["格安SIM 20GB おすすめ"], "ok_count": 1},
                {"date": "2026-07-21", "keywords": ["楽天モバイル 乗り換え 手順"], "ok_count": 1},
                {"date": "2026-07-13", "keywords": ["MNP 予約番号 取得方法"], "ok_count": 1},
                {"date": "2026-07-22", "keywords": ["格安SIM 速度 遅い 対処"], "ok_count": 0},
            ],
        }
        counts = reconstruct_week_type_counts(
            queue_state=queue_state, seed_rows=seed_rows, week_id="2026-W30"
        )
        # Only in-week, ok_count>0 entries are counted.
        self.assertEqual(counts, {"comparison": 1, "howto": 1})

    def test_run_publish_scheduled_dry_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "config").mkdir()
            (root / "data").mkdir()
            (root / "state").mkdir()
            (root / "site/src/content/articles").mkdir(parents=True)

            schedule_path = root / "config/publish-schedule.json"
            schedule_path.write_text(json.dumps(SCHEDULE), encoding="utf-8")
            seed_src = ROOT / "data/keywords.seed.csv"
            (root / "data/keywords.seed.csv").write_text(seed_src.read_text(encoding="utf-8"))

            monday = datetime(2026, 7, 20, 9, 0, tzinfo=ZoneInfo("Asia/Tokyo"))
            result = run_publish_scheduled(
                root=root,
                schedule_path=schedule_path,
                dry_run=True,
                now=monday,
            )
            self.assertFalse(result.skipped)
            self.assertEqual(result.keywords, ["格安SIM 20GB おすすめ"])


if __name__ == "__main__":
    unittest.main()
