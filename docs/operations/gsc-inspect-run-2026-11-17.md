# GSC 検査バッチ実行ログ（2026-11-17）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 235                             |
| pending        | 37                              |
| indexed        | 198                             |
| 今回バッチ     | 10 / 37                         |
| 生成日時 (UTC) | 2026-11-17T05:28:48.139Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | wimax-tethering-hikaku-2026      | api-only | NEUTRAL     |   ⏳    |      |
|   2 | linemo-norikae-tejun             | api-only | NEUTRAL     |   ⏳    |      |
|   3 | docomo-hikari-speed-slow-kaizen  | api-only | NEUTRAL     |   ⏳    |      |
|   4 | linemo-softbank-hikari-setwari   | api-only | NEUTRAL     |   ⏳    |      |
|   5 | uq-wimax-wimax-hikaku            | api-only | NEUTRAL     |   ⏳    |      |
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
