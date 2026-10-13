# GSC 検査バッチ実行ログ（2026-10-13）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 201                             |
| pending        | 30                              |
| indexed        | 171                             |
| 今回バッチ     | 10 / 30                         |
| 生成日時 (UTC) | 2026-10-13T04:11:46.855Z        |

## 結果

|   # | slug                          | UI       | API verdict | indexed | 備考 |
| --: | ----------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | au-hikari-kouji-chien-kakunin | api-only | NEUTRAL     |   ⏳    |      |
|   2 | sim-norikae-carrier-hikaku    | api-only | NEUTRAL     |   ⏳    |      |
|   3 | mnp-one-stop-tejun            | api-only | NEUTRAL     |   ⏳    |      |
|   4 | wimax-speed-slow-kaizen       | api-only | NEUTRAL     |   ⏳    |      |
|   5 | wimax-hikari-norikae-koteihi  | api-only | NEUTRAL     |   ⏳    |      |
|   6 | sim-norikae-mnp-hikaku        | api-only | NEUTRAL     |   ⏳    |      |
|   7 | sim-20gb-osusume              | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-fukukaisen-osusume        | api-only | NEUTRAL     |   ⏳    |      |
|   9 | iijmio-kaituu-dekinai-fix     | api-only | NEUTRAL     |   ⏳    |      |
|  10 | povo-kaiyaku-tejun            | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
