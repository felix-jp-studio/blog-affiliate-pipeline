# GSC 検査バッチ実行ログ（2026-11-21）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 239                             |
| pending        | 37                              |
| indexed        | 202                             |
| 今回バッチ     | 10 / 38                         |
| 生成日時 (UTC) | 2026-11-21T04:32:21.080Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | ahamo-norikae-tejun              | api-only | NEUTRAL     |   ⏳    |      |
|   2 | wimax-kaituu-dekinai-fix         | api-only | PASS        |   ✅    |      |
|   3 | wimax-kouji-fuyou-hikaku         | api-only | NEUTRAL     |   ⏳    |      |
|   4 | mineo-norikae-tejun              | api-only | NEUTRAL     |   ⏳    |      |
|   5 | sim-20gb-osusume                 | api-only | NEUTRAL     |   ⏳    |      |
|   6 | sim-fukukaisen-osusume           | api-only | NEUTRAL     |   ⏳    |      |
|   7 | iijmio-kaituu-dekinai-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   8 | povo-kaiyaku-tejun               | api-only | NEUTRAL     |   ⏳    |      |
|   9 | rakuten-mobile-esim-settei-tejun | api-only | NEUTRAL     |   ⏳    |      |
|  10 | tsushin-koteihi-minaoshi         | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
