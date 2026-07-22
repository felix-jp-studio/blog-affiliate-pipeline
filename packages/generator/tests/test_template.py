import unittest
from pathlib import Path

from generator.affiliate import inject_affiliates
from generator.quality import check_article
from generator.template_articles import build_body, build_outline


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


if __name__ == "__main__":
    unittest.main()
