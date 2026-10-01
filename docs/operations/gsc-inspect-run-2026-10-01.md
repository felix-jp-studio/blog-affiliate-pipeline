# GSC 検査バッチ実行ログ（2026-10-01）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 189                             |
| pending        | 27                              |
| indexed        | 162                             |
| 今回バッチ     | 10 / 28                         |
| 生成日時 (UTC) | 2026-10-01T02:46:01.590Z        |

## 結果

|   # | slug                          | UI       | API verdict | indexed | 備考 |
| --: | ----------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | fukukaisen-esim-sim-hikaku    | api-only | NEUTRAL     |   ⏳    |      |
|   2 | mnp-norikae-tejun-shoshinsha  | api-only | NEUTRAL     |   ⏳    |      |
|   3 | hikari-slow-genin-fix         | api-only | NEUTRAL     |   ⏳    |      |
|   4 | docomo-denki-set              | api-only | NEUTRAL     |   ⏳    |      |
|   5 | sim-fukukaisen-osusume-hikaku | api-only | PASS        |   ✅    |      |
|   6 | sim-kaituu-tejun              | api-only | NEUTRAL     |   ⏳    |      |
|   7 | hikari-tsunagaranai-fix       | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-20gb-osusume              | api-only | NEUTRAL     |   ⏳    |      |
|   9 | sim-fukukaisen-osusume        | api-only | NEUTRAL     |   ⏳    |      |
|  10 | iijmio-kaituu-dekinai-fix     | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
