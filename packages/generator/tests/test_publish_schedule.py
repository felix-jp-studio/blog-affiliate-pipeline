import json
import tempfile
import unittest
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from generator.publish_schedule import (
    compute_next_scheduled,
    infer_category,
    is_due_today,
    load_keywords_seed,
    pick_next_keywords,
    run_publish_scheduled,
    seed_row_to_item,
)
from generator.template_articles import assert_seo_slug, slugify

ROOT = Path(__file__).resolve().parents[3]
SCHEDULE = {
    "mode": "weekly",
    "days": ["monday", "thursday"],
    "articles_per_run": 1,
    "timezone": "Asia/Tokyo",
    "max_per_week": 2,
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

    def test_is_due_today_skips_non_scheduled_day(self):
        wednesday = datetime(2026, 7, 22, 9, 0, tzinfo=ZoneInfo("Asia/Tokyo"))
        decision = is_due_today(SCHEDULE, now=wednesday, queue_state={})
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
        queue_state = {"week_id": "2026-W30", "runs_this_week": 2}
        decision = is_due_today(SCHEDULE, now=monday, queue_state=queue_state)
        self.assertFalse(decision.due)
        self.assertEqual(decision.reason, "weekly limit reached")

    def test_compute_next_scheduled_from_monday(self):
        monday = date(2026, 7, 20)
        self.assertEqual(compute_next_scheduled(SCHEDULE, from_day=monday), date(2026, 7, 23))

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
