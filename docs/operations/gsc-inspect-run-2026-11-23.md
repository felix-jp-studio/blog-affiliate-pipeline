# GSC 検査バッチ実行ログ（2026-11-23）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 241                             |
| pending        | 38                              |
| indexed        | 203                             |
| 今回バッチ     | 10 / 39                         |
| 生成日時 (UTC) | 2026-11-23T04:23:21.935Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | ahamo-norikae-tejun              | api-only | NEUTRAL     |   ⏳    |      |
|   2 | wimax-kouji-fuyou-hikaku         | api-only | NEUTRAL     |   ⏳    |      |
|   3 | mineo-norikae-tejun              | api-only | PASS        |   ✅    |      |
|   4 | sim-esim-settei-dekinai          | api-only | NEUTRAL     |   ⏳    |      |
|   5 | nuro-hikari-au-denki-setwari     | api-only | NEUTRAL     |   ⏳    |      |
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
