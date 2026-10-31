# GSC 検査バッチ実行ログ（2026-10-31）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 218                             |
| pending        | 29                              |
| indexed        | 189                             |
| 今回バッチ     | 10 / 29                         |
| 生成日時 (UTC) | 2026-10-31T02:59:31.294Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | hikari-hikkoshi-norikae-tejun    | api-only | NEUTRAL     |   ⏳    |      |
|   2 | sim-20gb-osusume                 | api-only | NEUTRAL     |   ⏳    |      |
|   3 | sim-fukukaisen-osusume           | api-only | NEUTRAL     |   ⏳    |      |
|   4 | iijmio-kaituu-dekinai-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   5 | povo-kaiyaku-tejun               | api-only | NEUTRAL     |   ⏳    |      |
|   6 | rakuten-mobile-esim-settei-tejun | api-only | NEUTRAL     |   ⏳    |      |
|   7 | tsushin-koteihi-minaoshi         | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-apn-settei-tejun             | api-only | NEUTRAL     |   ⏳    |      |
|   9 | povo-topping-kaiyaku-houhou      | api-only | NEUTRAL     |   ⏳    |      |
|  10 | ahamo-oomori-option-fuyou        | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
