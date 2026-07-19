import tempfile
import unittest
from pathlib import Path

from generator.pipeline import generate_one
from generator.quality import check_article
from generator.template_articles import assert_seo_slug

ROOT = Path(__file__).resolve().parents[3]


class E2EPublishTest(unittest.TestCase):
    def test_template_generate_one_writes_valid_article(self):
        item = {
            "keyword": "工事 不要 光回線",
            "articleType": "comparison",
            "category": "hikari",
            "priority": 17,
        }

        with tempfile.TemporaryDirectory() as tmp:
            out_dir = Path(tmp)
            path = generate_one(root=ROOT, item=item, out_dir=out_dir, mode="template")

            self.assertTrue(path.exists())
            slug = path.stem
            assert_seo_slug(slug, keyword=item["keyword"])
            self.assertNotRegex(slug, r"^article-p\d+$")
            self.assertEqual(slug, "kouji-fuyou-hikari")

            content = path.read_text(encoding="utf-8")
            self.assertTrue(content.startswith("---\n"))
            parts = content.split("---", 2)
            self.assertEqual(len(parts), 3)
            frontmatter = parts[1]
            body = parts[2].strip()

            for field in (
                "title:",
                "description:",
                "pubDate:",
                "category: hikari",
                "articleType: comparison",
                "keyword:",
                "draft: false",
            ):
                self.assertIn(field, frontmatter)

            result = check_article(body, item["articleType"], ROOT, test_mode=True)
            self.assertTrue(result.ok, result.errors)


if __name__ == "__main__":
    unittest.main()
