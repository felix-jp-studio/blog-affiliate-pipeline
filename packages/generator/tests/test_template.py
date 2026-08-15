import unittest
from pathlib import Path

from generator.affiliate import inject_affiliates
from generator.quality import check_article
from generator.template_articles import build_body, build_outline, build_meta_description, build_meta_title


ROOT = Path(__file__).resolve().parents[3]


class TemplateGenerationTest(unittest.TestCase):
    def test_comparison_passes_quality(self):
        item = {
            "keyword": "格安SIM 20GB おすすめ",
            "articleType": "comparison",
            "category": "sim",
        }
        outline = build_outline(item)
        body = inject_affiliates(build_body(outline), ROOT)
        result = check_article(body, "comparison", ROOT, test_mode=True)
        self.assertTrue(result.ok, result.errors)

    def test_affiliate_injection_replaces_url_only(self):
        body = "[LINEMOの公式を見る]({AFFILIATE:linemo})"
        injected = inject_affiliates(body, ROOT)
        self.assertIn(
            "https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3776193&pid=892660854",
            injected,
        )
        self.assertNotIn("AFFILIATE", injected)

    def test_hikari_comparison_passes_quality(self):
        item = {
            "keyword": "NURO 光 料金 キャンペーン",
            "articleType": "comparison",
            "category": "hikari",
        }
        outline = build_outline(item)
        body = inject_affiliates(build_body(outline), ROOT)
        result = check_article(body, "comparison", ROOT, test_mode=True)
        self.assertTrue(result.ok, result.errors)
        self.assertIn("auひかり", body)
        self.assertNotIn("valuecommerce.com", body)

    def test_hikari_mansion_slug_is_seo_friendly(self):
        item = {
            "keyword": "光回線 マンション おすすめ",
            "articleType": "comparison",
            "category": "hikari",
            "priority": 16,
        }
        outline = build_outline(item)
        self.assertEqual(outline["slug"], "hikari-mansion-osusume")
        self.assertEqual(outline["priority"], 16)
        import json

        batch = json.loads((ROOT / "config/test-batch.json").read_text(encoding="utf-8"))
        self.assertEqual(len(batch["items"]), 5)

    def test_crosssell_passes_quality(self):
        item = {
            "keyword": "auでんき セット割",
            "articleType": "crosssell",
            "category": "cost",
            "priority": 1,
        }
        outline = build_outline(item)
        self.assertEqual(outline["slug"], "au-denki-setwari")
        body = inject_affiliates(build_body(outline), ROOT)
        result = check_article(body, "crosssell", ROOT, test_mode=True)
        self.assertTrue(result.ok, result.errors)
        self.assertIn("px.a8.net", body)
        self.assertNotIn("MNP予約番号", body)



    def test_esim_howto_passes_quality_after_injection(self):
        item = {
            "keyword": "eSIM 乗り換え 即日",
            "articleType": "howto",
            "category": "sim",
        }
        outline = build_outline(item)
        body = inject_affiliates(build_body(outline), ROOT)
        from generator.internal_links import inject_internal_links

        body = inject_internal_links(body, outline, ROOT)
        result = check_article(body, "howto", ROOT, test_mode=True)
        self.assertTrue(result.ok, result.errors)

    def test_placeholder_only_passes_quality_without_injection(self):
        item = {
            "keyword": "格安SIM 20GB おすすめ",
            "articleType": "comparison",
            "category": "sim",
        }
        outline = build_outline(item)
        body = build_body(outline)
        result = check_article(
            body,
            "comparison",
            ROOT,
            test_mode=True,
            allow_affiliate_placeholders=True,
        )
        self.assertTrue(result.ok, result.errors)
        self.assertRegex(body, r"\{\{?AFFILIATE:")

    def test_meta_title_includes_year_and_intent_for_comparison(self):
        title = build_meta_title("WiMAX 料金 比較 2026", "comparison")
        self.assertIn("2026年", title)
        self.assertIn("比較", title)
        self.assertIn("5社", title)

    def test_meta_title_includes_steps_for_howto(self):
        title = build_meta_title("eSIM 乗り換え 即日", "howto")
        self.assertIn("手順", title)
        self.assertIn("5ステップ", title)
        self.assertIn("2026年", title)

    def test_meta_title_includes_causes_for_troubleshoot(self):
        title = build_meta_title("格安SIM 速度 遅い 対処", "troubleshoot")
        self.assertIn("原因", title)
        self.assertIn("7つ", title)
        self.assertIn("2026年", title)

    def test_meta_description_includes_numbers_for_comparison(self):
        desc = build_meta_description("格安SIM キャリア 比較", "comparison")
        self.assertIn("5社", desc)
        self.assertIn("2026年", desc)

    def test_build_outline_uses_meta_templates(self):
        item = {
            "keyword": "ahamo povo 比較",
            "articleType": "comparison",
            "category": "sim",
        }
        outline = build_outline(item)
        self.assertIn("2026年", outline["title"])
        self.assertIn("5社", outline["metaDescription"])

    def test_comparison_includes_snippet_sections(self):
        item = {
            "keyword": "格安SIM 20GB おすすめ",
            "articleType": "comparison",
            "category": "sim",
        }
        outline = build_outline(item)
        body = build_body(outline)
        self.assertIn("## 要点（結論）", body)
        self.assertIn("- **データ容量**", body)
        self.assertIn("比較の一覧表です", body)

    def test_howto_includes_snippet_bullets(self):
        item = {
            "keyword": "eSIM 乗り換え 即日",
            "articleType": "howto",
            "category": "sim",
        }
        outline = build_outline(item)
        body = build_body(outline)
        self.assertIn("## 要点（結論）", body)
        self.assertIn("- **事前準備**", body)


if __name__ == "__main__":
    unittest.main()
