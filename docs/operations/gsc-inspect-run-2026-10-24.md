# GSC 検査バッチ実行ログ（2026-10-24）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 211                             |
| pending        | 28                              |
| indexed        | 183                             |
| 今回バッチ     | 10 / 30                         |
| 生成日時 (UTC) | 2026-10-24T02:14:02.573Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | nuro-hikari-moushikomi-tejun     | api-only | PASS        |   ✅    |      |
|   2 | docomo-setwari-hikari-fee-hikaku | api-only | PASS        |   ✅    |      |
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
