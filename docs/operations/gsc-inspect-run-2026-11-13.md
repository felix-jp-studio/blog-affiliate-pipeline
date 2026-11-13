# GSC 検査バッチ実行ログ（2026-11-13）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 231                             |
| pending        | 34                              |
| indexed        | 197                             |
| 今回バッチ     | 10 / 37                         |
| 生成日時 (UTC) | 2026-11-13T03:51:27.480Z        |

## 結果

|   # | slug                                    | UI       | API verdict | indexed | 備考 |
| --: | --------------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | uq-mobile-tsunagaranai-fix              | api-only | PASS        |   ✅    |      |
|   2 | hikkoshi-sim-hikari-setwari             | api-only | NEUTRAL     |   ⏳    |      |
|   3 | wimax-5g-home-router-hikaku-2026        | api-only | PASS        |   ✅    |      |
|   4 | rakuten-mobile-kazokuwari-kanyuu-houhou | api-only | NEUTRAL     |   ⏳    |      |
|   5 | iijmio-tsunagaranai-fix                 | api-only | PASS        |   ✅    |      |
|   6 | wimax-tethering-hikaku-2026             | api-only | NEUTRAL     |   ⏳    |      |
|   7 | sim-20gb-osusume                        | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-fukukaisen-osusume                  | api-only | NEUTRAL     |   ⏳    |      |
|   9 | iijmio-kaituu-dekinai-fix               | api-only | NEUTRAL     |   ⏳    |      |
|  10 | povo-kaiyaku-tejun                      | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
