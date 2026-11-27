# GSC 検査バッチ実行ログ（2026-11-27）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 245                             |
| pending        | 35                              |
| indexed        | 210                             |
| 今回バッチ     | 10 / 36                         |
| 生成日時 (UTC) | 2026-11-27T05:37:44.105Z        |

## 結果

|   # | slug                              | UI       | API verdict | indexed | 備考 |
| --: | --------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | nuro-hikari-au-denki-setwari      | api-only | NEUTRAL     |   ⏳    |      |
|   2 | ahamo-oomori-option-hikaku        | api-only | NEUTRAL     |   ⏳    |      |
|   3 | sim-fukukaisen-osusume            | api-only | NEUTRAL     |   ⏳    |      |
|   4 | iijmio-kaituu-dekinai-fix         | api-only | NEUTRAL     |   ⏳    |      |
|   5 | rakuten-mobile-esim-settei-tejun  | api-only | NEUTRAL     |   ⏳    |      |
|   6 | tsushin-koteihi-minaoshi          | api-only | NEUTRAL     |   ⏳    |      |
|   7 | sim-apn-settei-tejun              | api-only | NEUTRAL     |   ⏳    |      |
|   8 | povo-topping-kaiyaku-houhou       | api-only | PASS        |   ✅    |      |
|   9 | ahamo-oomori-option-fuyou         | api-only | NEUTRAL     |   ⏳    |      |
|  10 | senior-smartphone-sim-hikaku-2026 | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
