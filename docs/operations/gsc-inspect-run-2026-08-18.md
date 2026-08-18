# GSC 検査バッチ実行ログ（2026-08-18）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | ui+api                          |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 147                             |
| pending        | 62                              |
| indexed        | 85                              |
| 今回バッチ     | 10 / 66                         |
| 生成日時 (UTC) | 2026-08-18T00:37:48.966Z        |

## 結果

|   # | slug                            | UI              | API verdict | indexed | 備考                          |
| --: | ------------------------------- | --------------- | ----------- | :-----: | ----------------------------- |
|   1 | hikari-setwari-fee-hikaku       | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   2 | uq-mobile-esim-settei-houhou    | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   3 | au-hikari-tsunagaranai-fix      | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   4 | hikkoshi-hikari-denki-set       | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   5 | nuro-hikari-kaiyaku-kin-hikaku  | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   6 | nuro-hikari-campaign            | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   7 | rakuten-mobile-switch           | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   8 | rakuten-mobile-uq-mobile-hikaku | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   9 | sim-20gb-osusume                | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|  10 | sim-carrier-hikaku              | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
