# GSC 検査バッチ実行ログ（2026-09-30）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 188                             |
| pending        | 27                              |
| indexed        | 161                             |
| 今回バッチ     | 10 / 27                         |
| 生成日時 (UTC) | 2026-09-30T02:42:46.559Z        |

## 結果

|   # | slug                          | UI       | API verdict | indexed | 備考 |
| --: | ----------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | ahamo-tsunagaranai-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   2 | fukukaisen-esim-sim-hikaku    | api-only | NEUTRAL     |   ⏳    |      |
|   3 | mnp-norikae-tejun-shoshinsha  | api-only | NEUTRAL     |   ⏳    |      |
|   4 | hikari-slow-genin-fix         | api-only | NEUTRAL     |   ⏳    |      |
|   5 | docomo-denki-set              | api-only | NEUTRAL     |   ⏳    |      |
|   6 | sim-fukukaisen-osusume-hikaku | api-only | NEUTRAL     |   ⏳    |      |
|   7 | sim-kaituu-tejun              | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-20gb-osusume              | api-only | NEUTRAL     |   ⏳    |      |
|   9 | sim-fukukaisen-osusume        | api-only | NEUTRAL     |   ⏳    |      |
|  10 | iijmio-kaituu-dekinai-fix     | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
