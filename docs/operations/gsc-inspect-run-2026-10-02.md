# GSC 検査バッチ実行ログ（2026-10-02）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 190                             |
| pending        | 25                              |
| indexed        | 165                             |
| 今回バッチ     | 10 / 28                         |
| 生成日時 (UTC) | 2026-10-02T02:50:11.091Z        |

## 結果

|   # | slug                         | UI       | API verdict | indexed | 備考 |
| --: | ---------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | mnp-norikae-tejun-shoshinsha | api-only | NEUTRAL     |   ⏳    |      |
|   2 | hikari-slow-genin-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   3 | docomo-denki-set             | api-only | NEUTRAL     |   ⏳    |      |
|   4 | sim-kaituu-tejun             | api-only | PASS        |   ✅    |      |
|   5 | hikari-tsunagaranai-fix      | api-only | PASS        |   ✅    |      |
|   6 | docomo-fukukaisen-sim-hikaku | api-only | PASS        |   ✅    |      |
|   7 | sim-20gb-osusume             | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-fukukaisen-osusume       | api-only | NEUTRAL     |   ⏳    |      |
|   9 | iijmio-kaituu-dekinai-fix    | api-only | NEUTRAL     |   ⏳    |      |
|  10 | povo-kaiyaku-tejun           | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
