# GSC CSV → rewrite-queue インポート

> **User CSV 共有後**に Agent が実行。表示データが少ない場合は空キューのままで OK。

## 手順（User）

1. [Search Console](https://search.google.com/search-console) → パフォーマンス → 検索結果
2. 期間: 直近 **28 日**
3. クエリタブ → **エクスポート**（CSV）
4. `blog-affiliate-pipeline/data/gsc-performance-YYYYMMDD.csv` として Agent に共有

## 手順（Agent）

```bash
# dry-run（キューは書き換えない）
npm run gsc:import-rewrite-queue -- --csv=data/gsc-performance-YYYYMMDD.csv --dry-run

# 本番 import（11–30 位を pending 追記）
npm run gsc:import-rewrite-queue -- --csv=data/gsc-performance-YYYYMMDD.csv
```

## 出力

- 正本: `data/rewrite-queue.csv`
- 週次処理: `npm run rewrite:weekly` / `.github/workflows/rewrite-weekly.yml`

## 関連

- `docs/rewrite-weekly-workflow.md`
- roadmap: `gsc-rewrite-queue-v1`
