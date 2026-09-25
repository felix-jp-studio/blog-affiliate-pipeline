# GSC 検査バッチ実行ログ（2026-09-25）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 183                             |
| pending        | 22                              |
| indexed        | 161                             |
| 今回バッチ     | 10 / 22                         |
| 生成日時 (UTC) | 2026-09-25T02:11:35.062Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | povo-2-0-tsukaikata              | api-only | NEUTRAL     |   ⏳    |      |
|   2 | kodomo-sim-family-hikaku         | api-only | NEUTRAL     |   ⏳    |      |
|   3 | ahamo-tsunagaranai-fix           | api-only | NEUTRAL     |   ⏳    |      |
|   4 | fukukaisen-esim-sim-hikaku       | api-only | NEUTRAL     |   ⏳    |      |
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
