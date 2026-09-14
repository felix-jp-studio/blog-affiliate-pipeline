# GSC 検査バッチ実行ログ（2026-09-14）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 172                             |
| pending        | 16                              |
| indexed        | 156                             |
| 今回バッチ     | 10 / 18                         |
| 生成日時 (UTC) | 2026-09-14T02:00:30.377Z        |

## 結果

|   # | slug                             | UI       | API verdict | indexed | 備考 |
| --: | -------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | 60-sim-osusume-hikaku            | api-only | NEUTRAL     |   ⏳    |      |
|   2 | wimax-norikae-tejun              | api-only | NEUTRAL     |   ⏳    |      |
|   3 | home-router-norikae-tejun        | api-only | PASS        |   ✅    |      |
|   4 | sim-onsei-tuwa-dekinai-genin     | api-only | PASS        |   ✅    |      |
|   5 | hikkoshi-internet-denki          | api-only | NEUTRAL     |   ⏳    |      |
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
