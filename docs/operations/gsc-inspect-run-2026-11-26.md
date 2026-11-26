# GSC 検査バッチ実行ログ（2026-11-26）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 244                             |
| pending        | 35                              |
| indexed        | 209                             |
| 今回バッチ     | 10 / 39                         |
| 生成日時 (UTC) | 2026-11-26T05:43:43.278Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | wimax-kouji-fuyou-hikaku         | api-only | NEUTRAL     |   ⏳    |      |
|   2 | nuro-hikari-au-denki-setwari     | api-only | NEUTRAL     |   ⏳    |      |
|   3 | iijmio-norikae-tejun             | api-only | PASS        |   ✅    |      |
|   4 | mnp-one-stop-error-fix           | api-only | PASS        |   ✅    |      |
|   5 | sim-20gb-osusume                 | api-only | PASS        |   ✅    |      |
|   6 | sim-fukukaisen-osusume           | api-only | NEUTRAL     |   ⏳    |      |
|   7 | iijmio-kaituu-dekinai-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   8 | povo-kaiyaku-tejun               | api-only | PASS        |   ✅    |      |
|   9 | rakuten-mobile-esim-settei-tejun | api-only | NEUTRAL     |   ⏳    |      |
|  10 | tsushin-koteihi-minaoshi         | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
