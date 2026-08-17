# GSC 検査バッチ実行ログ（2026-08-17）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | ui+api                          |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 146                             |
| pending        | 65                              |
| indexed        | 81                              |
| 今回バッチ     | 10 / 73                         |
| 生成日時 (UTC) | 2026-08-17T00:36:34.592Z        |

## 結果

|   # | slug                           | UI              | API verdict | indexed | 備考                          |
| --: | ------------------------------ | --------------- | ----------- | :-----: | ----------------------------- |
|   1 | hikari-10g-hikaku-osusume      | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   2 | 3-hikkoshi-sim-campaign        | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   3 | au-smart-value-denki           | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   4 | iijmio-kaiyaku-tejun           | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   5 | esim-saihakko-tejun            | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   6 | docomo-hikari-tsunagaranai-fix | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   7 | 2-hikkoshi-hikari-campaign     | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   8 | ymobile-uq-mobile-hikaku       | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   9 | povo-koteihi-minaoshi          | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|  10 | ymobile-kaiyaku-tejun          | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
