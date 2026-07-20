# 日曜クロスセル記事 — 設計サマリー

## 目的

月〜土の SIM / 光 / トラブル記事（3タイプ×2）に加え、**日曜 09:00 JST** に固定費×通信のクロスセル記事を 1 本公開する。

## スケジュール

| 曜日   | キーワード CSV             | 記事タイプ                        | 配分                       |
| ------ | -------------------------- | --------------------------------- | -------------------------- |
| 月〜土 | `data/keywords.seed.csv`   | comparison / howto / troubleshoot | 各2本/週（インターリーブ） |
| 日曜   | `data/keywords.sunday.csv` | crosssell のみ                    | 1本/週（priority 順）      |

- 週上限: **7本**（`max_per_week: 7`）
- GitHub Actions cron: `0 0 * * 0-6`（UTC 日〜土 00:00 = JST 09:00）
- 日曜の `type_counts` は Mon-Sat のタイプ均等配分に影響しない（別 CSV・別タイプ）

## コンテンツ

- **category**: `cost`（固定費・ライフイベント）
- **articleType**: `crosssell`（ラベル: 固定費・セット）
- **Hub**: `/cost`
- **生成**: テンプレート / Groq（`article-crosssell.md`、2段階 CV → 既存キャリアアフィリエイト）

## 関連ファイル

- `config/publish-schedule.json` — `sunday_type`, `sunday_keywords_seed`
- `packages/generator/generator/publish_schedule.py` — 日曜分岐
- `data/keywords.sunday.csv` — 初期 18 KW
- `config/prompts/article-crosssell.md`
- `config/affiliate-rules.json` — `crosssell` タイプルール
