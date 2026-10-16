# GSC 検査バッチ実行ログ（2026-10-16）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 204                             |
| pending        | 33                              |
| indexed        | 171                             |
| 今回バッチ     | 10 / 33                         |
| 生成日時 (UTC) | 2026-10-16T01:56:14.612Z        |

## 結果

|   # | slug                                | UI       | API verdict | indexed | 備考 |
| --: | ----------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | mnp-one-stop-tejun                  | api-only | NEUTRAL     |   ⏳    |      |
|   2 | wimax-speed-slow-kaizen             | api-only | NEUTRAL     |   ⏳    |      |
|   3 | wimax-hikari-norikae-koteihi        | api-only | NEUTRAL     |   ⏳    |      |
|   4 | sim-norikae-mnp-hikaku              | api-only | NEUTRAL     |   ⏳    |      |
|   5 | mnp-yoyaku-bangou-yukokigen-kakunin | api-only | NEUTRAL     |   ⏳    |      |
|   6 | home-router-tsunagaranai-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   7 | au-setwari-hikari-sim-hikaku        | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-20gb-osusume                    | api-only | NEUTRAL     |   ⏳    |      |
|   9 | sim-fukukaisen-osusume              | api-only | NEUTRAL     |   ⏳    |      |
|  10 | iijmio-kaituu-dekinai-fix           | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
