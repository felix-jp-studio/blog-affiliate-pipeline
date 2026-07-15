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
        self.assertIn("https://www.linemo.jp/", injected)
        self.assertNotIn("AFFILIATE", injected)

    def test_batch_has_five_items(self):
        import json

        batch = json.loads((ROOT / "config/test-batch.json").read_text(encoding="utf-8"))
        self.assertEqual(len(batch["items"]), 5)


if __name__ == "__main__":
    unittest.main()
