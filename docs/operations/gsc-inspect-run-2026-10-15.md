# GSC 検査バッチ実行ログ（2026-10-15）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 203                             |
| pending        | 32                              |
| indexed        | 171                             |
| 今回バッチ     | 10 / 32                         |
| 生成日時 (UTC) | 2026-10-15T02:05:50.184Z        |

## 結果

|   # | slug                                | UI       | API verdict | indexed | 備考 |
| --: | ----------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | sim-norikae-carrier-hikaku          | api-only | NEUTRAL     |   ⏳    |      |
|   2 | mnp-one-stop-tejun                  | api-only | NEUTRAL     |   ⏳    |      |
|   3 | wimax-speed-slow-kaizen             | api-only | NEUTRAL     |   ⏳    |      |
|   4 | wimax-hikari-norikae-koteihi        | api-only | NEUTRAL     |   ⏳    |      |
|   5 | sim-norikae-mnp-hikaku              | api-only | NEUTRAL     |   ⏳    |      |
|   6 | mnp-yoyaku-bangou-yukokigen-kakunin | api-only | NEUTRAL     |   ⏳    |      |
|   7 | home-router-tsunagaranai-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-20gb-osusume                    | api-only | NEUTRAL     |   ⏳    |      |
|   9 | sim-fukukaisen-osusume              | api-only | NEUTRAL     |   ⏳    |      |
|  10 | iijmio-kaituu-dekinai-fix           | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
