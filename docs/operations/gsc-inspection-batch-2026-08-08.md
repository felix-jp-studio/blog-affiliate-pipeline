# GSC URL 検査バッチ（2026-08-08）

> **Agent prep only** — `indexed: true` は User 確認後のみ更新する。

## 手順（User）

1. [Google Search Console](https://search.google.com/search-console) を開く
2. プロパティ `https://sim-hikari-guide.com` を選択
3. 下記 URL を **1 日 5–10 本** 上限で URL 検査 → インデックス登録をリクエスト
4. 完了した slug を Agent に共有（例: `indexed: ahamo-povo-hikaku,au-denki-setwari`）

## キュー概況

| 項目 | 値 |
| --- | --- |
| キュー合計 | 54 |
| pending | 26 |
| indexed | 28 |
| 今週追加 pending | 7 |
| 今回バッチ | 10 / 26 |

## 本日の検査リスト

1. [nuro-hikari-campaign](https://sim-hikari-guide.com/articles/nuro-hikari-campaign) — merged 2026-07-29
2. [rakuten-mobile-switch](https://sim-hikari-guide.com/articles/rakuten-mobile-switch) — merged 2026-07-29
3. [rakuten-mobile-uq-mobile-hikaku](https://sim-hikari-guide.com/articles/rakuten-mobile-uq-mobile-hikaku) — merged 2026-07-29
4. [sim-20gb-osusume](https://sim-hikari-guide.com/articles/sim-20gb-osusume) — merged 2026-07-29
5. [sim-carrier-hikaku](https://sim-hikari-guide.com/articles/sim-carrier-hikaku) — merged 2026-07-29
6. [sim-gakusei-osusume](https://sim-hikari-guide.com/articles/sim-gakusei-osusume) — merged 2026-07-29
7. [sim-houjin-osusume](https://sim-hikari-guide.com/articles/sim-houjin-osusume) — merged 2026-07-29
8. [sim-kakehoudai-yasui](https://sim-hikari-guide.com/articles/sim-kakehoudai-yasui) — merged 2026-07-29
9. [sim-osusume-hikaku-2026](https://sim-hikari-guide.com/articles/sim-osusume-hikaku-2026) — merged 2026-07-29
10. [sim-speed-slow-fix](https://sim-hikari-guide.com/articles/sim-speed-slow-fix) — merged 2026-07-29

User 確認後のみ: `npm run gsc:inspection-batch -- --mark-indexed=slug1,slug2`

## 再生成コマンド

```bash
npm run gsc:inspection-batch -- --format=md --limit=10
npm run gsc:inspection-batch -- --write-note
```

