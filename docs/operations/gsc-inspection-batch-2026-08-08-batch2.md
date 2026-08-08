# GSC URL 検査バッチ（2026-08-08）

> **Agent prep only** — `indexed: true` は User 確認後のみ更新する。

## 手順（User）

1. [Google Search Console](https://search.google.com/search-console) を開く
2. プロパティ `https://sim-hikari-guide.com` を選択
3. 下記 URL を **1 日 5–10 本** 上限で URL 検査 → インデックス登録をリクエスト
4. 完了した slug を Agent に共有（例: `indexed: ahamo-povo-hikaku,au-denki-setwari`）

## キュー概況

| 項目             | 値                  |
| ---------------- | ------------------- |
| キュー合計       | 54                  |
| pending          | 26                  |
| indexed          | 28                  |
| 今週追加 pending | 7                   |
| 今回バッチ       | 10 / 26 (offset 10) |

## 本日の検査リスト

1. [sim-tethering-osusume](https://sim-hikari-guide.com/articles/sim-tethering-osusume) — merged 2026-07-29
2. [sim-tuuwa-teigaku-hikaku](https://sim-hikari-guide.com/articles/sim-tuuwa-teigaku-hikaku) — merged 2026-07-29
3. [sim-unlimited-data](https://sim-hikari-guide.com/articles/sim-unlimited-data) — merged 2026-07-29
4. [smartphone-setwari-hikaku](https://sim-hikari-guide.com/articles/smartphone-setwari-hikaku) — merged 2026-07-29
5. [softbank-hikari-biglobe-hikari-hikaku](https://sim-hikari-guide.com/articles/softbank-hikari-biglobe-hikari-hikaku) — merged 2026-07-29
6. [wimax-fee-hikaku-2026](https://sim-hikari-guide.com/articles/wimax-fee-hikaku-2026) — merged 2026-07-29
7. [sim-kodomo-osusume](https://sim-hikari-guide.com/articles/sim-kodomo-osusume) — merged 2026-07-30
8. [hikkoshi-hikari-tetsuzuki](https://sim-hikari-guide.com/articles/hikkoshi-hikari-tetsuzuki) — merged 2026-07-31
9. [softbank-hikari-shogai-kakunin](https://sim-hikari-guide.com/articles/softbank-hikari-shogai-kakunin) — merged 2026-08-01
10. [au-denki-fee-hikaku](https://sim-hikari-guide.com/articles/au-denki-fee-hikaku) — merged 2026-08-02 🆕

User 確認後のみ: `npm run gsc:inspection-batch -- --mark-indexed=slug1,slug2`

## 再生成コマンド

```bash
npm run gsc:inspection-batch -- --format=md --limit=10
npm run gsc:inspection-batch -- --write-note
```
