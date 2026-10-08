# GSC 検査バッチ実行ログ（2026-10-08）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 196                             |
| pending        | 25                              |
| indexed        | 171                             |
| 今回バッチ     | 10 / 28                         |
| 生成日時 (UTC) | 2026-10-08T03:16:15.575Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | ahamo-setwari-hikari-kakunin     | api-only | PASS        |   ✅    |      |
|   2 | mnp-norikae-campaign-hikaku-2026 | api-only | PASS        |   ✅    |      |
|   3 | android-sim-settei-houhou        | api-only | PASS        |   ✅    |      |
|   4 | au-hikari-kouji-chien-kakunin    | api-only | NEUTRAL     |   ⏳    |      |
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
