import tempfile
import unittest
from datetime import date
from pathlib import Path

from generator.internal_links import (
    MARKER,
    MARKER_V1,
    ArticleRef,
    backfill_article_file,
    build_internal_links_section,
    inject_internal_links,
    insert_internal_links_section,
    load_published_articles,
    pick_cross_entity_links,
    pick_internal_links,
    pick_internal_links_v2,
    replace_internal_links_section,
)
from generator.template_articles import build_body, build_outline


ROOT = Path(__file__).resolve().parents[3]


def _ref(slug: str, title: str, category: str, day: int, article_type: str = "comparison") -> ArticleRef:
    return ArticleRef(slug, title, category, article_type, date(2026, 7, day))


class InternalLinksTest(unittest.TestCase):
    def test_pick_same_category_excludes_current_slug(self):
        articles = [
            _ref("a", "A", "sim", 20),
            _ref("b", "B", "sim", 19),
            _ref("c", "C", "hikari", 18),
        ]
        picked = pick_internal_links(category="sim", exclude_slug="a", articles=articles)
        self.assertEqual([link.slug for link in picked], ["b"])

    def test_pick_cross_entity_sim_includes_hikari_and_trouble(self):
        articles = [
            _ref("sim-a", "Sim A", "sim", 20),
            _ref("hikari-a", "Hikari A", "hikari", 19, "howto"),
            _ref("trouble-a", "Trouble A", "trouble", 18, "troubleshoot"),
            _ref("cost-a", "Cost A", "cost", 17, "crosssell"),
        ]
        picked = pick_cross_entity_links(
            category="sim",
            exclude_slug="sim-a",
            articles=articles,
            count=2,
        )
        self.assertEqual([link.slug for link in picked], ["hikari-a", "trouble-a"])

    def test_pick_v2_combines_same_and_cross(self):
        articles = [
            _ref("sim-a", "Sim A", "sim", 21),
            _ref("sim-b", "Sim B", "sim", 20),
            _ref("sim-c", "Sim C", "sim", 19),
            _ref("hikari-a", "Hikari A", "hikari", 18, "howto"),
            _ref("trouble-a", "Trouble A", "trouble", 17, "howto"),
        ]
        picked = pick_internal_links_v2(
            category="sim",
            exclude_slug="sim-a",
            articles=articles,
        )
        self.assertEqual(
            [link.slug for link in picked],
            ["sim-b", "sim-c", "hikari-a", "trouble-a"],
        )

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
            (articles_dir / "hikari-switch-osusume.md").write_text(
                """---
title: "光回線 乗り換え"
description: "d"
pubDate: 2026-07-17
category: hikari
articleType: comparison
keyword: "k3"
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
            self.assertIn(MARKER, injected)
            self.assertIn("/articles/sim-20gb-osusume", injected)
            self.assertIn("/articles/rakuten-mobile-switch", injected)
            self.assertIn("/articles/hikari-switch-osusume", injected)
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

    def test_backfill_article_file_skips_when_no_peers(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            articles_dir = root / "site/src/content/articles"
            articles_dir.mkdir(parents=True)
            article_path = articles_dir / "lonely.md"
            article_path.write_text(
                """---
title: "Alone"
description: "d"
pubDate: 2026-07-20
category: cost
articleType: crosssell
keyword: "k"
draft: false
---

## 結論

本文

> 本記事は AI 支援により作成されています。
""",
                encoding="utf-8",
            )

            self.assertFalse(backfill_article_file(article_path, root))
            self.assertNotIn("## あわせて読みたい", article_path.read_text(encoding="utf-8"))

    def test_backfill_article_file_injects_before_faq(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            articles_dir = root / "site/src/content/articles"
            articles_dir.mkdir(parents=True)
            (articles_dir / "sim-peer-a.md").write_text(
                """---
title: "Peer A"
description: "d"
pubDate: 2026-07-21
category: sim
articleType: comparison
keyword: "k"
draft: false
---

body
""",
                encoding="utf-8",
            )
            (articles_dir / "sim-peer-b.md").write_text(
                """---
title: "Peer B"
description: "d"
pubDate: 2026-07-20
category: sim
articleType: comparison
keyword: "k2"
draft: false
---

body
""",
                encoding="utf-8",
            )
            (articles_dir / "hikari-peer.md").write_text(
                """---
title: "Hikari Peer"
description: "d"
pubDate: 2026-07-19
category: hikari
articleType: howto
keyword: "k3"
draft: false
---

body
""",
                encoding="utf-8",
            )
            target = articles_dir / "sim-target.md"
            target.write_text(
                """---
title: "Target"
description: "d"
pubDate: 2026-07-19
category: sim
articleType: comparison
keyword: "k4"
draft: false
---

## 本文

## よくある質問

### Q

A
""",
                encoding="utf-8",
            )

            self.assertTrue(backfill_article_file(target, root))
            updated = target.read_text(encoding="utf-8")
            self.assertIn("## あわせて読みたい", updated)
            self.assertIn(MARKER, updated)
            self.assertLess(updated.index("## あわせて読みたい"), updated.index("## よくある質問"))
            self.assertIn("/articles/sim-peer-a", updated)
            self.assertIn("/articles/sim-peer-b", updated)
            self.assertIn("/articles/hikari-peer", updated)

    def test_upgrade_v1_to_v2(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            articles_dir = root / "site/src/content/articles"
            articles_dir.mkdir(parents=True)
            (articles_dir / "sim-peer.md").write_text(
                """---
title: "Sim Peer"
description: "d"
pubDate: 2026-07-21
category: sim
articleType: comparison
keyword: "k"
draft: false
---

body
""",
                encoding="utf-8",
            )
            (articles_dir / "hikari-peer.md").write_text(
                """---
title: "Hikari Peer"
description: "d"
pubDate: 2026-07-20
category: hikari
articleType: howto
keyword: "k2"
draft: false
---

body
""",
                encoding="utf-8",
            )
            target = articles_dir / "trouble-target.md"
            target.write_text(
                f"""---
title: "Trouble Target"
description: "d"
pubDate: 2026-07-19
category: trouble
articleType: troubleshoot
keyword: "k3"
draft: false
---

## 本文

{MARKER_V1}

## あわせて読みたい

同じカテゴリの関連記事もあわせてご確認ください。

- [Old](/articles/old)

## よくある質問

### Q

A
""",
                encoding="utf-8",
            )

            self.assertFalse(backfill_article_file(target, root, upgrade_v1=False))
            self.assertTrue(backfill_article_file(target, root, upgrade_v1=True))
            updated = target.read_text(encoding="utf-8")
            self.assertIn(MARKER, updated)
            self.assertNotIn(MARKER_V1, updated)
            self.assertIn("/articles/sim-peer", updated)
            self.assertIn("/articles/hikari-peer", updated)
            self.assertNotIn("/articles/old", updated)

    def test_replace_internal_links_section(self):
        body = f"{MARKER_V1}\n## あわせて読みたい\n\n- [old](/articles/old)\n\n## よくある質問\n"
        section = build_internal_links_section([_ref("new", "New", "sim", 1)])
        updated = replace_internal_links_section(body, section)
        self.assertIn("/articles/new", updated)
        self.assertNotIn("/articles/old", updated)
        self.assertIn("## よくある質問", updated)


if __name__ == "__main__":
    unittest.main()
