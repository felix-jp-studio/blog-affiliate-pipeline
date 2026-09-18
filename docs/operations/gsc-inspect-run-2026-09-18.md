# GSC 検査バッチ実行ログ（2026-09-18）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 176                             |
| pending        | 18                              |
| indexed        | 158                             |
| 今回バッチ     | 10 / 18                         |
| 生成日時 (UTC) | 2026-09-18T01:52:28.731Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | sim-kakehoudai-kaiyaku-houhou    | api-only | NEUTRAL     |   ⏳    |      |
|   2 | mnp-yoyaku-bangou-error-fix      | api-only | NEUTRAL     |   ⏳    |      |
|   3 | sim-gakusei-20gb-hikaku          | api-only | NEUTRAL     |   ⏳    |      |
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
