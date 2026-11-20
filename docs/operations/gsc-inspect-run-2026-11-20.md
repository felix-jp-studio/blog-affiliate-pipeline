# GSC 検査バッチ実行ログ（2026-11-20）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 238                             |
| pending        | 37                              |
| indexed        | 201                             |
| 今回バッチ     | 10 / 39                         |
| 生成日時 (UTC) | 2026-11-20T04:42:10.387Z        |

## 結果

|   # | slug                            | UI       | API verdict | indexed | 備考 |
| --: | ------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | linemo-norikae-tejun            | api-only | NEUTRAL     |   ⏳    |      |
|   2 | docomo-hikari-speed-slow-kaizen | api-only | PASS        |   ✅    |      |
|   3 | uq-wimax-wimax-hikaku           | api-only | PASS        |   ✅    |      |
|   4 | ahamo-norikae-tejun             | api-only | NEUTRAL     |   ⏳    |      |
|   5 | wimax-kaituu-dekinai-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   6 | wimax-kouji-fuyou-hikaku        | api-only | NEUTRAL     |   ⏳    |      |
|   7 | sim-20gb-osusume                | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-fukukaisen-osusume          | api-only | NEUTRAL     |   ⏳    |      |
|   9 | iijmio-kaituu-dekinai-fix       | api-only | NEUTRAL     |   ⏳    |      |
|  10 | povo-kaiyaku-tejun              | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
