import tempfile
import unittest
from pathlib import Path

from generator.backfill_meta import backfill_meta_file


class BackfillMetaTitlesTest(unittest.TestCase):
    def test_updates_title_and_description_from_keyword(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "sim-20gb-osusume.md"
            path.write_text(
                """---
title: "旧タイトル"
description: "旧description"
pubDate: 2026-07-17
category: sim
articleType: comparison
keyword: "格安SIM 20GB おすすめ"
draft: false
---

## 本文
""",
                encoding="utf-8",
            )

            changed = backfill_meta_file(path)
            self.assertTrue(changed)

            text = path.read_text(encoding="utf-8")
            self.assertIn("【2026年最新】格安SIM 20GB比較", text)
            self.assertIn("5社比較", text)
            self.assertIn("## 本文", text)
            self.assertNotIn("旧タイトル", text)

    def test_skips_when_already_up_to_date(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "mnp-reservation-number.md"
            path.write_text(
                """---
title: "MNP予約番号の取得方法【2026年版】手順と注意点"
description: "MNP 予約番号 取得方法を5ステップで解説。【2026年版】必要書類・所要時間・つまずきポイントを公式情報に基づき整理。"
pubDate: 2026-07-17
category: sim
articleType: howto
keyword: "MNP 予約番号 取得方法"
draft: false
---

body
""",
                encoding="utf-8",
            )

            self.assertFalse(backfill_meta_file(path))


if __name__ == "__main__":
    unittest.main()
