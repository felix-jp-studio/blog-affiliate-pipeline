# パイプラインフロー

## Phase 0（現在）

```
drafts/*.md  →  publisher (wp:post)  →  WordPress
                    ↑
            affiliate-rules.json
```

## Phase 0.5（テスト記事）

```
config/test-batch.json
    → generator (template|groq) → site/src/content/articles/*.md
    → astro build → Vercel
```

## Phase 1（Month 2 目標）

```
keywords.seed.csv
    → keyword-cli → keywords.db
    → generator (outline) → drafts/outline-*.json
    → generator (article) → drafts/article-*.md
    → quality check
    → publisher → WordPress
```

## Phase 2

- scraper: 料金変更検知 → リライトキュー
- weekly-report: GSC / GA4 レポート
