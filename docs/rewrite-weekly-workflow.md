# 週次リライト workflow（スケルトン）

GSC クエリ CSV から作成する `data/rewrite-queue.csv` を読み、週 1 本の記事リライト候補を選ぶ GitHub Actions です。  
キューにエントリがある場合、meta title/description の backfill + `dateModified` 更新 PR を作成します。空キューは **exit 0**。

| 項目         | 値                                                               |
| ------------ | ---------------------------------------------------------------- |
| キュー正本   | `data/rewrite-queue.csv`                                         |
| 実行 script  | `node scripts/rewrite-weekly.mjs`                                |
| workflow     | `.github/workflows/rewrite-weekly.yml`                           |
| スケジュール | 毎週月曜 10:00 JST + `workflow_dispatch`                         |
| オペ doc     | `blog-affiliate-auto/docs/operations/rewrite-weekly-workflow.md` |

## キュー CSV 形式

```csv
slug,query,position,priority,status,notes
sim-speed-slow-fix,格安sim 速度 遅い,18,1,pending,CTR改善候補
```

- `status`: 空または `pending` が未処理。処理後は `done` 等に更新（将来）
- キューが空（ヘッダーのみ）→ script は **exit 0**（CI 失敗にしない）

## 手動実行

```bash
node scripts/rewrite-weekly.mjs
node scripts/rewrite-weekly.mjs --dry-run
```

GitHub Actions → **Rewrite weekly** → **Run workflow**

## 今後（gsc-rewrite-queue-v1 連携）

1. User が GSC 28 日 CSV を共有
2. Agent が 11–30 位クエリを抽出して `rewrite-queue.csv` を更新
3. 本 workflow が先頭 `pending` を選び、タイトル/meta リライト PR を作成（`--create-pr`）
