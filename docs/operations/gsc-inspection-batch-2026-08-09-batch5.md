# GSC URL 検査バッチ（2026-08-09）

> **Agent prep only** — `indexed: true` は User 確認後のみ更新する。

## 手順（User）

1. [Google Search Console](https://search.google.com/search-console) を開く
2. プロパティ `https://sim-hikari-guide.com` を選択
3. 下記 URL を **1 日 5–10 本** 上限で URL 検査 → インデックス登録をリクエスト
4. 完了した slug を Agent に共有（例: `indexed: ahamo-povo-hikaku,au-denki-setwari`）

## キュー概況

| 項目             | 値                 |
| ---------------- | ------------------ |
| キュー合計       | 55                 |
| pending          | 27                 |
| indexed          | 28                 |
| 今週追加 pending | 7                  |
| 今回バッチ       | 7 / 27 (offset 20) |

## 本日の検査リスト

1. [sim-fukukaisen-osusume](https://sim-hikari-guide.com/articles/sim-fukukaisen-osusume) — merged 2026-08-03 🆕
2. [povo-data-yoryou-tsuika-houhou](https://sim-hikari-guide.com/articles/povo-data-yoryou-tsuika-houhou) — merged 2026-08-04 🆕
3. [povo-speed-slow-fix](https://sim-hikari-guide.com/articles/povo-speed-slow-fix) — merged 2026-08-05 🆕
4. [sim-norikae-osusume](https://sim-hikari-guide.com/articles/sim-norikae-osusume) — merged 2026-08-06 🆕
5. [ahamo-oomori-option-moushikomi-tejun](https://sim-hikari-guide.com/articles/ahamo-oomori-option-moushikomi-tejun) — merged 2026-08-07 🆕
6. [iijmio-speed-slow-fix](https://sim-hikari-guide.com/articles/iijmio-speed-slow-fix) — merged 2026-08-08 🆕
7. [rakuten-denki-fee](https://sim-hikari-guide.com/articles/rakuten-denki-fee) — merged 2026-08-09 🆕

User 確認後のみ: `npm run gsc:inspection-batch -- --mark-indexed=slug1,slug2`

## 再生成コマンド

```bash
npm run gsc:inspection-batch -- --format=md --limit=10
npm run gsc:inspection-batch -- --write-note
```
