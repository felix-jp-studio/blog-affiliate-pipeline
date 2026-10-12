# GSC 検査バッチ実行ログ（2026-10-12）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 200                             |
| pending        | 29                              |
| indexed        | 171                             |
| 今回バッチ     | 10 / 29                         |
| 生成日時 (UTC) | 2026-10-12T02:57:25.369Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | au-hikari-kouji-chien-kakunin    | api-only | NEUTRAL     |   ⏳    |      |
|   2 | sim-norikae-carrier-hikaku       | api-only | NEUTRAL     |   ⏳    |      |
|   3 | mnp-one-stop-tejun               | api-only | NEUTRAL     |   ⏳    |      |
|   4 | wimax-speed-slow-kaizen          | api-only | NEUTRAL     |   ⏳    |      |
|   5 | wimax-hikari-norikae-koteihi     | api-only | NEUTRAL     |   ⏳    |      |
|   6 | sim-20gb-osusume                 | api-only | NEUTRAL     |   ⏳    |      |
|   7 | sim-fukukaisen-osusume           | api-only | NEUTRAL     |   ⏳    |      |
|   8 | iijmio-kaituu-dekinai-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   9 | povo-kaiyaku-tejun               | api-only | NEUTRAL     |   ⏳    |      |
|  10 | rakuten-mobile-esim-settei-tejun | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
