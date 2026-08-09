# GSC 週次ログ（2026-08-09 / Week 6）

> **User 入力待ち** — 下記メトリクスを Search Console から共有してください。

## 記録日

- 記録日: 2026-08-09
- 対象期間: 直近 28 日（GSC デフォルト）

## サイト全体

| 指標         | 値          | 前週比 |
| ------------ | ----------- | ------ |
| クリック数   | _User 入力_ | —      |
| 表示回数     | _User 入力_ | —      |
| CTR          | _User 入力_ | —      |
| 平均掲載順位 | _User 入力_ | —      |

## インデックス状況（Agent 管理キュー）

| 項目             | 値                                                   |
| ---------------- | ---------------------------------------------------- |
| キュー合計       | 55                                                   |
| indexed          | 28                                                   |
| pending          | 27                                                   |
| 今週の検査バッチ | `docs/operations/gsc-inspection-batch-2026-08-08.md` |

## 記事・供給（Agent）

| 項目       | 値                                            |
| ---------- | --------------------------------------------- |
| 公開記事数 | 55（+1: `rakuten-denki-fee` 8/9 公開）        |
| KW 在庫    | 320 → 330（#158 予定）+ crosssell 33（本 PR） |
| orphan     | 0                                             |

## 上位クエリ TOP5（クリック順）

1. _User 入力_
2. _User 入力_
3. _User 入力_
4. _User 入力_
5. _User 入力_

## 所感・次アクション

- [ ] GSC バッチ1（10 URL）→ [batch1](./gsc-inspection-batch-2026-08-08.md)
- [ ] GSC バッチ2（10 URL）→ [batch2](./gsc-inspection-batch-2026-08-08-batch2.md)
- [ ] GSC バッチ4（残り7 URL）→ [batch4](./gsc-inspection-batch-2026-08-08-batch4.md)
- [ ] GSC バッチ5（offset 20）→ [batch5](./gsc-inspection-batch-2026-08-09-batch5.md)
- [ ] rewrite-queue: 8件 heuristic seed 済（`npm run seed:rewrite-queue`）
- [ ] 週次クォータ ratio bias 適用 → [quota note](./article-type-ratio-quota-2026-08-09.md)（#158）
- [ ] いずれか完了後 Agent に「全N件検査完了」+ slug 一覧
- [ ] GSC 28日 CSV → `npm run gsc:import-rewrite-queue`

## 再生成コマンド

```bash
npm run gsc:inspection-batch -- --format=md --limit=10
npm run gsc:inspection-batch -- --write-note=docs/operations/gsc-inspection-batch-YYYY-MM-DD.md
npm run audit:orphans
npm run report:article-type-ratio
```
