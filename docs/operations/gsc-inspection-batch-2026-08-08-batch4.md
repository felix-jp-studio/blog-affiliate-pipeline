# GSC URL 検査バッチ4 — 残り pending 6 件（2026-08-08）

> **Agent prep only** — `indexed: true` は User 確認後のみ更新する。

## 推奨順序

| バッチ | 件数      | ドキュメント                                          |
| ------ | --------- | ----------------------------------------------------- |
| 1      | 10        | [batch1](./gsc-inspection-batch-2026-08-08.md)        |
| 2      | 10        | [batch2](./gsc-inspection-batch-2026-08-08-batch2.md) |
| 3–4    | 6（残り） | 本ファイル                                            |

## 手順（User）

1. [Google Search Console](https://search.google.com/search-console) を開く
2. プロパティ `https://sim-hikari-guide.com` を選択
3. 下記 URL を **1 日 5–10 本** 上限で URL 検査 → インデックス登録をリクエスト
4. 完了した slug を Agent に共有

## キュー概況

| 項目       | 値                  |
| ---------- | ------------------- |
| キュー合計 | 54                  |
| pending    | 26                  |
| indexed    | 28                  |
| 今回バッチ | 6 / 26（offset 20） |

## 検査リスト（最新5本 + 本日分）

1. [sim-fukukaisen-osusume](https://sim-hikari-guide.com/articles/sim-fukukaisen-osusume) — merged 2026-08-03 🆕
2. [povo-data-yoryou-tsuika-houhou](https://sim-hikari-guide.com/articles/povo-data-yoryou-tsuika-houhou) — merged 2026-08-04 🆕
3. [povo-speed-slow-fix](https://sim-hikari-guide.com/articles/povo-speed-slow-fix) — merged 2026-08-05 🆕
4. [sim-norikae-osusume](https://sim-hikari-guide.com/articles/sim-norikae-osusume) — merged 2026-08-06 🆕
5. [ahamo-oomori-option-moushikomi-tejun](https://sim-hikari-guide.com/articles/ahamo-oomori-option-moushikomi-tejun) — merged 2026-08-07 🆕
6. [iijmio-speed-slow-fix](https://sim-hikari-guide.com/articles/iijmio-speed-slow-fix) — merged 2026-08-08 🆕

User 確認後のみ: `npm run gsc:inspection-batch -- --mark-indexed=slug1,slug2`

## 再生成コマンド

```bash
npm run gsc:inspection-batch -- --format=md --limit=10 --offset=20
npm run gsc:inspection-batch -- --write-note=docs/operations/gsc-inspection-batch-2026-08-08-batch4.md
```
