# GSC 検査バッチ実行ログ（2026-11-16）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 234                             |
| pending        | 36                              |
| indexed        | 198                             |
| 今回バッチ     | 10 / 36                         |
| 生成日時 (UTC) | 2026-11-16T03:29:21.917Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | wimax-tethering-hikaku-2026      | api-only | NEUTRAL     |   ⏳    |      |
|   2 | linemo-norikae-tejun             | api-only | NEUTRAL     |   ⏳    |      |
|   3 | docomo-hikari-speed-slow-kaizen  | api-only | NEUTRAL     |   ⏳    |      |
|   4 | linemo-softbank-hikari-setwari   | api-only | NEUTRAL     |   ⏳    |      |
|   5 | sim-20gb-osusume                 | api-only | NEUTRAL     |   ⏳    |      |
|   6 | sim-fukukaisen-osusume           | api-only | NEUTRAL     |   ⏳    |      |
|   7 | iijmio-kaituu-dekinai-fix        | api-only | NEUTRAL     |   ⏳    |      |
|   8 | povo-kaiyaku-tejun               | api-only | NEUTRAL     |   ⏳    |      |
|   9 | rakuten-mobile-esim-settei-tejun | api-only | NEUTRAL     |   ⏳    |      |
|  10 | tsushin-koteihi-minaoshi         | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
