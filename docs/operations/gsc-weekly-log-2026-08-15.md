# GSC 週次ログ（2026-08-15 / Week 5）

> **User 入力待ち（GSC ダッシュボード）** — サイト全体の表示・クリックは Search Console から共有してください。  
> **Agent 管理** — インデックスキュー・記事数は `data/gsc-index-queue.json` から自動集計。

## 記録日

- 記録日: 2026-08-15
- 対象期間: 直近 28 日（GSC デフォルト）
- 関連 Issue: [#229](https://github.com/felix-jp-studio/blog-affiliate-pipeline/issues/229)

> **User コメント (2026-08-15)**: 表示0、クリック0、インデックス54

## サイト全体（User 入力）

| 指標         | 値          | 前週比 |
| ------------ | ----------- | ------ |
| クリック数   | _User 入力_ | —      |
| 表示回数     | _User 入力_ | —      |
| CTR          | _User 入力_ | —      |
| 平均掲載順位 | _User 入力_ | —      |

## インデックス状況（Agent 管理キュー）

| 項目         | 値                                              |
| ------------ | ----------------------------------------------- |
| キュー合計   | 145                                             |
| indexed      | 67（46.2%）                                     |
| pending      | 78                                              |
| 消化 ETA     | 約 8 日（10 URL/日）                            |
| 最新検査ログ | `docs/operations/gsc-inspect-run-2026-08-15.md` |

## 記事・供給（Agent）

| 項目       | 値                       |
| ---------- | ------------------------ |
| 公開記事数 | 145                      |
| orphan     | `npm run audit:orphans`  |
| hub mesh   | `npm run audit:hub-mesh` |

## 上位クエリ TOP5（クリック順）

1. _User 入力_
2. _User 入力_
3. _User 入力_
4. _User 入力_
5. _User 入力_

## 所感・次アクション

- [ ] GSC 28 日 CSV → `data/gsc-performance-YYYYMMDD.csv` → `npm run gsc:import-rewrite-queue`
- [ ] pending 78 本 — 日次 `gsc-inspect-daily` で消化（ETA 約 8 日）
- [ ] GSC / IndexNow secrets 未設定分 → [issue-229-secrets-checklist.md](./issue-229-secrets-checklist.md)
- [ ] Visitability PDCA — `npm run visitability:metrics -- --update-state`

## 再生成コマンド

```bash
npm run gsc:weekly-log
npm run gsc:weekly-log -- --date=2026-08-15
npm run gsc:index-queue-status
npm run gsc:inspection-batch -- --format=md --limit=10
```
