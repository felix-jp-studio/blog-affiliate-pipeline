# GSC 検査バッチ実行ログ（2026-08-19）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | ui+api                          |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 147                             |
| pending        | 58                              |
| indexed        | 89                              |
| 今回バッチ     | 10 / 62                         |
| 生成日時 (UTC) | 2026-08-19T00:35:13.750Z        |

## 結果

|   # | slug                           | UI              | API verdict | indexed | 備考                          |
| --: | ------------------------------ | --------------- | ----------- | :-----: | ----------------------------- |
|   1 | uq-mobile-esim-settei-houhou   | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   2 | au-hikari-tsunagaranai-fix     | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   3 | hikkoshi-hikari-denki-set      | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   4 | nuro-hikari-kaiyaku-kin-hikaku | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   5 | rakuten-mobile-switch          | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   6 | sim-20gb-osusume               | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   7 | sim-gakusei-osusume            | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   8 | sim-houjin-osusume             | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   9 | sim-kakehoudai-yasui           | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|  10 | sim-osusume-hikaku-2026        | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
