# 光回線料金スナップショット baseline（2026-08-08）

## ファイル

| ファイル                                | 役割                |
| --------------------------------------- | ------------------- |
| `data/hikari-prices-snapshot.json`      | 最新 scrape 結果    |
| `data/hikari-prices-snapshot.prev.json` | 前回比較用 baseline |

## 初回 baseline 確立

2026-08-08: 現行 `hikari-prices-snapshot.json` を `hikari-prices-snapshot.prev.json` にコピーして初回 baseline を設定。

## 運用

1. `hikari-price-scraper` 実行前に current → prev へ rotate（workflow 自動化済）
2. scrape 後 `npm run price-diff:rewrite-hook:dry-run` で差分確認
3. 差分あり → `npm run price-diff:rewrite-hook` で `rewrite-queue.csv` 更新

## 関連

- `docs/operations/price-diff-dry-run-2026-08-08.md`
- `.github/workflows/hikari-price-scraper.yml`
- `.github/workflows/price-diff-rewrite-hook.yml`
