# GSC 検査バッチ実行ログ（2026-10-27）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 214                             |
| pending        | 28                              |
| indexed        | 186                             |
| 今回バッチ     | 10 / 30                         |
| 生成日時 (UTC) | 2026-10-27T02:39:32.609Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | au-hikari-norikae-tejun          | api-only | PASS        |   ✅    |      |
|   2 | hikari-kaiyaku-kin-hikaku-2026   | api-only | PASS        |   ✅    |      |
|   3 | sim-20gb-osusume                 | api-only | NEUTRAL     |   ⏳    |      |
|   4 | sim-fukukaisen-osusume           | api-only | NEUTRAL     |   ⏳    |      |
|   5 | iijmio-kaituu-dekinai-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   6 | povo-kaiyaku-tejun               | api-only | NEUTRAL     |   ⏳    |      |
|   7 | rakuten-mobile-esim-settei-tejun | api-only | NEUTRAL     |   ⏳    |      |
|   8 | tsushin-koteihi-minaoshi         | api-only | NEUTRAL     |   ⏳    |      |
|   9 | sim-apn-settei-tejun             | api-only | NEUTRAL     |   ⏳    |      |
|  10 | povo-topping-kaiyaku-houhou      | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
