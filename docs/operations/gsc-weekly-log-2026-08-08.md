# GSC 週次ログ（2026-08-08 / Week 5）

> **User 入力待ち** — 下記メトリクスを Search Console から共有してください。

## 記録日

- 記録日: 2026-08-08
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
| キュー合計       | 54                                                   |
| indexed          | 28                                                   |
| pending          | 26                                                   |
| 今週の検査バッチ | `docs/operations/gsc-inspection-batch-2026-08-08.md` |

## 上位クエリ TOP5（クリック順）

1. _User 入力_
2. _User 入力_
3. _User 入力_
4. _User 入力_
5. _User 入力_

## 所感・次アクション

- [ ] GSC バッチ1（10 URL）→ [batch1](./gsc-inspection-batch-2026-08-08.md)
- [ ] GSC バッチ2（10 URL）→ [batch2](./gsc-inspection-batch-2026-08-08-batch2.md)
- [ ] GSC バッチ4（残り6 URL）→ [batch4](./gsc-inspection-batch-2026-08-08-batch4.md)
- [ ] いずれか完了後 Agent に「全N件検査完了」+ slug 一覧
- [ ] 表示 > 0 になったクエリがあれば rewrite-queue 候補に追加
- [ ] #147 マージ済 — internal v3 / 54記事 onboard 本番反映済

## 再生成コマンド

```bash
npm run gsc:inspection-batch -- --format=md --limit=10
npm run gsc:inspection-batch -- --write-note=docs/operations/gsc-inspection-batch-YYYY-MM-DD.md
npm run audit:orphans
```
