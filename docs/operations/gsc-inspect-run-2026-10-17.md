# GSC 検査バッチ実行ログ（2026-10-17）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 205                             |
| pending        | 31                              |
| indexed        | 174                             |
| 今回バッチ     | 10 / 34                         |
| 生成日時 (UTC) | 2026-10-17T01:50:59.066Z        |

## 結果

|   # | slug                                | UI       | API verdict | indexed | 備考 |
| --: | ----------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | wimax-speed-slow-kaizen             | api-only | NEUTRAL     |   ⏳    |      |
|   2 | wimax-hikari-norikae-koteihi        | api-only | NEUTRAL     |   ⏳    |      |
|   3 | sim-norikae-mnp-hikaku              | api-only | PASS        |   ✅    |      |
|   4 | mnp-yoyaku-bangou-yukokigen-kakunin | api-only | NEUTRAL     |   ⏳    |      |
|   5 | home-router-tsunagaranai-fix        | api-only | PASS        |   ✅    |      |
|   6 | au-setwari-hikari-sim-hikaku        | api-only | PASS        |   ✅    |      |
|   7 | sim-kakehoudai-tsuika-houhou        | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-20gb-osusume                    | api-only | NEUTRAL     |   ⏳    |      |
|   9 | sim-fukukaisen-osusume              | api-only | NEUTRAL     |   ⏳    |      |
|  10 | iijmio-kaituu-dekinai-fix           | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
