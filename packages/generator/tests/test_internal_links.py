import tempfile
import unittest
from datetime import date
from pathlib import Path

from generator.internal_links import (
    ArticleRef,
    build_internal_links_section,
    inject_internal_links,
    insert_internal_links_section,
    load_published_articles,
    pick_internal_links,
)
from generator.template_articles import build_body, build_outline


ROOT = Path(__file__).resolve().parents[3]


class InternalLinksTest(unittest.TestCase):
    def test_pick_same_category_excludes_current_slug(self):
        articles = [
            ArticleRef("a", "A", "sim", date(2026, 7, 20)),
            ArticleRef("b", "B", "sim", date(2026, 7, 19)),
            ArticleRef("c", "C", "hikari", date(2026, 7, 18)),
        ]
        picked = pick_internal_links(category="sim", exclude_slug="a", articles=articles)
        self.assertEqual([link.slug for link in picked], ["b"])

    def test_insert_before_faq(self):
        body = "## 注意点\n\n本文\n\n## よくある質問\n\n### Q\n\nA"
        section = "## あわせて読みたい\n\n- [x](/articles/x)\n\n"
        updated = insert_internal_links_section(body, section)
        self.assertLess(updated.index("## あわせて読みたい"), updated.index("## よくある質問"))

    def test_inject_uses_existing_articles(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            articles_dir = root / "site/src/content/articles"
            articles_dir.mkdir(parents=True)
            (articles_dir / "sim-20gb-osusume.md").write_text(
                """---
title: "格安SIM 20GB"
description: "d"
pubDate: 2026-07-19
category: sim
articleType: comparison
keyword: "k"
draft: false
---

body
""",
                encoding="utf-8",
            )
            (articles_dir / "rakuten-mobile-switch.md").write_text(
                """---
title: "楽天モバイル 乗り換え"
description: "d"
pubDate: 2026-07-18
category: sim
articleType: howto
keyword: "k2"
draft: false
---

body
""",
                encoding="utf-8",
            )

            item = {
                "keyword": "LINEMO 評判 デメリット",
                "articleType": "comparison",
                "category": "sim",
            }
            outline = build_outline(item)
            body = build_body(outline)
            injected = inject_internal_links(body, outline, root)

            self.assertIn("## あわせて読みたい", injected)
            self.assertIn("/articles/sim-20gb-osusume", injected)
            self.assertIn("/articles/rakuten-mobile-switch", injected)
            self.assertNotIn(f"/articles/{outline['slug']}", injected)

    def test_load_published_articles_skips_draft(self):
        with tempfile.TemporaryDirectory() as tmp:
            articles_dir = Path(tmp)
            (articles_dir / "draft.md").write_text(
                """---
title: "draft"
description: "d"
pubDate: 2026-07-19
category: sim
articleType: comparison
keyword: "k"
draft: true
---

body
""",
                encoding="utf-8",
            )
            loaded = load_published_articles(articles_dir)
            self.assertEqual(loaded, [])

    def test_build_section_empty(self):
        self.assertEqual(build_internal_links_section([]), "")


if __name__ == "__main__":
    unittest.main()
