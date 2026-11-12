# GSC 検査バッチ実行ログ（2026-11-12）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | api+api-only                    |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 230                             |
| pending        | 36                              |
| indexed        | 194                             |
| 今回バッチ     | 10 / 36                         |
| 生成日時 (UTC) | 2026-11-12T04:37:33.875Z        |

## 結果

|   # | slug                                    | UI       | API verdict | indexed | 備考 |
| --: | --------------------------------------- | -------- | ----------- | :-----: | ---- |
|   1 | sim-kaiyaku-iyakukin-hikaku             | api-only | NEUTRAL     |   ⏳    |      |
|   2 | uq-mobile-tsunagaranai-fix              | api-only | NEUTRAL     |   ⏳    |      |
|   3 | hikkoshi-sim-hikari-setwari             | api-only | NEUTRAL     |   ⏳    |      |
|   4 | wimax-5g-home-router-hikaku-2026        | api-only | NEUTRAL     |   ⏳    |      |
|   5 | rakuten-mobile-kazokuwari-kanyuu-houhou | api-only | NEUTRAL     |   ⏳    |      |
|   6 | iijmio-tsunagaranai-fix                 | api-only | NEUTRAL     |   ⏳    |      |
|   7 | sim-20gb-osusume                        | api-only | NEUTRAL     |   ⏳    |      |
|   8 | sim-fukukaisen-osusume                  | api-only | NEUTRAL     |   ⏳    |      |
|   9 | iijmio-kaituu-dekinai-fix               | api-only | NEUTRAL     |   ⏳    |      |
|  10 | povo-kaiyaku-tejun                      | api-only | NEUTRAL     |   ⏳    |      |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
