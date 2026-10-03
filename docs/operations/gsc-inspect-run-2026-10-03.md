# GSC 検査バッチ実行ログ（2026-10-03）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 191                             |
| pending        | 24                              |
| indexed        | 167                             |
| 今回バッチ     | 10 / 26                         |
| 生成日時 (UTC) | 2026-10-03T02:36:22.820Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | hikari-slow-genin-fix            | api-only | PASS        |   ✅    |      |
|   2 | docomo-denki-set                 | api-only | NEUTRAL     |   ⏳    |      |
|   3 | sim-sashikae-houhou-iphone       | api-only | PASS        |   ✅    |      |
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
