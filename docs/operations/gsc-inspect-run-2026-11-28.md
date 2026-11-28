# GSC 検査バッチ実行ログ（2026-11-28）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 246                             |
| pending        | 34                              |
| indexed        | 212                             |
| 今回バッチ     | 10 / 36                         |
| 生成日時 (UTC) | 2026-11-28T05:14:49.239Z        |

## 結果

|   # | slug                              | UI       | API verdict | indexed | 備考 |
| --: | --------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | nuro-hikari-au-denki-setwari      | api-only | NEUTRAL     |   ⏳    |      |
|   2 | ahamo-oomori-option-hikaku        | api-only | PASS        |   ✅    |      |
|   3 | tethering-settei-houhou-sim       | api-only | PASS        |   ✅    |      |
|   4 | sim-fukukaisen-osusume            | api-only | NEUTRAL     |   ⏳    |      |
|   5 | iijmio-kaituu-dekinai-fix         | api-only | NEUTRAL     |   ⏳    |      |
|   6 | rakuten-mobile-esim-settei-tejun  | api-only | NEUTRAL     |   ⏳    |      |
|   7 | tsushin-koteihi-minaoshi          | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-apn-settei-tejun              | api-only | NEUTRAL     |   ⏳    |      |
|   9 | ahamo-oomori-option-fuyou         | api-only | NEUTRAL     |   ⏳    |      |
|  10 | senior-smartphone-sim-hikaku-2026 | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
