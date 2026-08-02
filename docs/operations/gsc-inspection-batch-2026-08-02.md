# GSC URL 検査バッチ（2026-08-02）

> **Agent prep only** — `indexed: true` は User 確認後のみ更新する。

## 手順（User）

1. [Google Search Console](https://search.google.com/search-console) を開く
2. プロパティ `https://sim-hikari-guide.com` を選択
3. 下記 URL を **1 日 5–10 本** 上限で URL 検査 → インデックス登録をリクエスト
4. 完了した slug を Agent に共有（例: `indexed: ahamo-povo-hikaku,au-denki-setwari`）

## キュー概況

| 項目             | 値      |
| ---------------- | ------- |
| キュー合計       | 48      |
| pending          | 40      |
| indexed          | 8       |
| 今週追加 pending | 40      |
| 今回バッチ       | 10 / 40 |

## 本日の検査リスト

1. [ahamo-povo-hikaku](https://sim-hikari-guide.com/articles/ahamo-povo-hikaku) — merged 2026-07-29 🆕
2. [au-denki-setwari](https://sim-hikari-guide.com/articles/au-denki-setwari) — merged 2026-07-29 🆕
3. [docomo-hikari-hikari-collab-hikaku](https://sim-hikari-guide.com/articles/docomo-hikari-hikari-collab-hikaku) — merged 2026-07-29 🆕
4. [family-2-lines-cheap](https://sim-hikari-guide.com/articles/family-2-lines-cheap) — merged 2026-07-29 🆕
5. [hikari-1gbps-yasui](https://sim-hikari-guide.com/articles/hikari-1gbps-yasui) — merged 2026-07-29 🆕
6. [hikari-kodate-osusume](https://sim-hikari-guide.com/articles/hikari-kodate-osusume) — merged 2026-07-29 🆕
7. [hikari-mansion-osusume](https://sim-hikari-guide.com/articles/hikari-mansion-osusume) — merged 2026-07-29 🆕
8. [hikari-provider-chigai](https://sim-hikari-guide.com/articles/hikari-provider-chigai) — merged 2026-07-29 🆕
9. [hikari-switch-osusume](https://sim-hikari-guide.com/articles/hikari-switch-osusume) — merged 2026-07-29 🆕
10. [home-router-hikari-hikaku](https://sim-hikari-guide.com/articles/home-router-hikari-hikaku) — merged 2026-07-29 🆕

User 確認後のみ: `npm run gsc:inspection-batch -- --mark-indexed=slug1,slug2`

## 再生成コマンド

```bash
npm run gsc:inspection-batch -- --format=md --limit=10
npm run gsc:inspection-batch -- --write-note
```

## 完了記録（2026-08-02）

User 確認済み: 本日バッチ 10 URL をインデックス済み / 登録リクエスト済みとしてキュー更新。

```bash
npm run gsc:inspection-batch -- --mark-indexed=ahamo-povo-hikaku,au-denki-setwari,docomo-hikari-hikari-collab-hikaku,family-2-lines-cheap,hikari-1gbps-yasui,hikari-kodate-osusume,hikari-mansion-osusume,hikari-provider-chigai,hikari-switch-osusume,home-router-hikari-hikaku
```

- marked: 10
- pending remaining: 30（更新時点）

## 完了記録（2026-08-02 バッチ2）

User 確認済み: 次バッチ 10 URL をインデックス済み / 登録リクエスト済みとしてキュー更新。

```bash
npm run gsc:inspection-batch -- --mark-indexed=home-router-hitorigurashi,iijmio-hyoban-fee,kouji-fuyou-hikari,linemo-ahamo-hikaku,linemo-hyoban-demerit,mineo-hyoban-demerit,mnp-reservation-number,mobareco-air-wimax-hikaku,nihon-tsushin-sim-hyoban,nuro-hikari-au-hikari-hikaku
```

- marked: 10
- pending remaining: 20（更新時点）
