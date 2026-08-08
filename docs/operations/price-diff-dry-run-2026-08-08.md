# 料金差分 rewrite-hook dry-run（2026-08-08）

## 実行コマンド

```bash
npm run price-diff:rewrite-hook:dry-run
```

## 結果

```
price-diff-rewrite-hook: previous snapshot missing (data/hikari-prices-snapshot.prev.json) — skip (exit 0).
```

## 次アクション（Agent）

1. `hikari-price-scraper` 実行後、`data/hikari-prices-snapshot.json` を `data/hikari-prices-snapshot.prev.json` にコピーして初回 baseline を確立
2. 以降の dry-run / 本番 hook で差分検知 → `data/rewrite-queue.csv` へ追記

## User 待ち

- GSC CSV 共有後、`rewrite-queue.csv` を GSC 11–30 位 KW と統合
