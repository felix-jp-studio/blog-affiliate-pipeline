# 料金スナップショット差分 → rewrite-queue

## 目的

`data/hikari-prices-snapshot.json`（[hikari-price-scraper-v1](./hikari-price-scraper-design.md)）の前後比較で料金変更を検知し、`data/rewrite-queue.csv` に pending 行を追記する。

## 依存

- スナップショット形式: `version: "1"` + `providers.<key>.{monthlyFeeYen,constructionFeeYen,campaignNote,rewriteSlugs}`
- 初回は previous が無いため **exit 0 でスキップ**（エラーにしない）

## 使い方

```bash
# ライブパス（scraper v1 マージ後）
npm run price-diff:rewrite-hook -- --dry-run

# フィクスチャ（CI / ローカル検証）
npm run price-diff:rewrite-hook -- --dry-run \
  --previous=scripts/fixtures/hikari-prices-previous.json \
  --current=scripts/fixtures/hikari-prices-current.json
```

## 運用メモ

1. 月次 scraper が current を更新
2. 本フックが diff → queue 追記
3. 成功時に current を `data/hikari-prices-snapshot.prev.json` へコピー（デフォルトパス時）
4. `rewrite-weekly.yml` が queue から週 1 本リライト
