# GSC 検査バッチ実行ログ（2026-10-04）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 192                             |
| pending        | 25                              |
| indexed        | 167                             |
| 今回バッチ     | 10 / 25                         |
| 生成日時 (UTC) | 2026-10-04T03:07:58.328Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | docomo-denki-set                 | api-only | NEUTRAL     |   ⏳    |      |
|   2 | nuro-hikari-kaituu-slow-genin    | api-only | NEUTRAL     |   ⏳    |      |
|   3 | sim-20gb-osusume                 | api-only | NEUTRAL     |   ⏳    |      |
|   4 | sim-fukukaisen-osusume           | api-only | NEUTRAL     |   ⏳    |      |
|   5 | iijmio-kaituu-dekinai-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   6 | povo-kaiyaku-tejun               | api-only | NEUTRAL     |   ⏳    |      |
|   7 | rakuten-mobile-esim-settei-tejun | api-only | NEUTRAL     |   ⏳    |      |
|   8 | tsushin-koteihi-minaoshi         | api-only | NEUTRAL     |   ⏳    |      |
|   9 | sim-apn-settei-tejun             | api-only | NEUTRAL     |   ⏳    |      |
|  10 | ymobile-uq-mobile-hikaku         | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
