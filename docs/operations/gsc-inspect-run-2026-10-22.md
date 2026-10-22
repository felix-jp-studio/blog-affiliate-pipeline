# GSC 検査バッチ実行ログ（2026-10-22）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 210                             |
| pending        | 31                              |
| indexed        | 179                             |
| 今回バッチ     | 10 / 34                         |
| 生成日時 (UTC) | 2026-10-22T02:11:32.786Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | sim-kakehoudai-tsuika-houhou     | api-only | NEUTRAL     |   ⏳    |      |
|   2 | tethering-dekinai-sim            | api-only | PASS        |   ✅    |      |
|   3 | au-smart-value-setwari-hikaku    | api-only | PASS        |   ✅    |      |
|   4 | nuro-hikari-moushikomi-tejun     | api-only | NEUTRAL     |   ⏳    |      |
|   5 | sim-chakushin-dekinai-fix        | api-only | PASS        |   ✅    |      |
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
