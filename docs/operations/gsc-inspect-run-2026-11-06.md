# GSC 検査バッチ実行ログ（2026-11-06）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 224                             |
| pending        | 31                              |
| indexed        | 193                             |
| 今回バッチ     | 10 / 31                         |
| 生成日時 (UTC) | 2026-11-06T03:56:01.892Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | wimax-moushikomi-tejun           | api-only | NEUTRAL     |   ⏳    |      |
|   2 | sim-kaiyaku-ato-tsukaenai-fix    | api-only | NEUTRAL     |   ⏳    |      |
|   3 | sim-kaiyaku-iyakukin-hikaku      | api-only | NEUTRAL     |   ⏳    |      |
|   4 | sim-20gb-osusume                 | api-only | NEUTRAL     |   ⏳    |      |
|   5 | sim-fukukaisen-osusume           | api-only | NEUTRAL     |   ⏳    |      |
|   6 | iijmio-kaituu-dekinai-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   7 | povo-kaiyaku-tejun               | api-only | NEUTRAL     |   ⏳    |      |
|   8 | rakuten-mobile-esim-settei-tejun | api-only | NEUTRAL     |   ⏳    |      |
|   9 | tsushin-koteihi-minaoshi         | api-only | NEUTRAL     |   ⏳    |      |
|  10 | sim-apn-settei-tejun             | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
