# GSC 検査バッチ実行ログ（2026-09-28）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 186                             |
| pending        | 25                              |
| indexed        | 161                             |
| 今回バッチ     | 10 / 25                         |
| 生成日時 (UTC) | 2026-09-28T02:14:56.238Z        |

## 結果

|   # | slug                         | UI       | API verdict | indexed | 備考 |
| --: | ---------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | kodomo-sim-family-hikaku     | api-only | NEUTRAL     |   ⏳    |      |
|   2 | ahamo-tsunagaranai-fix       | api-only | NEUTRAL     |   ⏳    |      |
|   3 | fukukaisen-esim-sim-hikaku   | api-only | NEUTRAL     |   ⏳    |      |
|   4 | mnp-norikae-tejun-shoshinsha | api-only | NEUTRAL     |   ⏳    |      |
|   5 | hikari-slow-genin-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   6 | docomo-denki-set             | api-only | NEUTRAL     |   ⏳    |      |
|   7 | sim-20gb-osusume             | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-fukukaisen-osusume       | api-only | NEUTRAL     |   ⏳    |      |
|   9 | iijmio-kaituu-dekinai-fix    | api-only | NEUTRAL     |   ⏳    |      |
|  10 | povo-kaiyaku-tejun           | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
