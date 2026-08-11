# GSC 検査バッチ実行ログ（2026-08-11）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | ui+api                          |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 142                             |
| pending        | 104                             |
| indexed        | 38                              |
| 今回バッチ     | 10 / 113                        |
| 生成日時 (UTC) | 2026-08-11T00:50:44.116Z        |

## 結果

|   # | slug                                 | UI              | API verdict | indexed | 備考                          |
| --: | ------------------------------------ | --------------- | ----------- | :-----: | ----------------------------- |
|   1 | povo-speed-slow-fix                  | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   2 | sim-norikae-osusume                  | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   3 | ahamo-oomori-option-moushikomi-tejun | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   4 | iijmio-speed-slow-fix                | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   5 | rakuten-denki-fee                    | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   6 | ahamo-kaiyaku-tejun                  | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   7 | uq-mobile-kaiyaku-tejun              | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   8 | esim-kishu-henkou-tejun              | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   9 | ahamo-moushikomi-error-fix           | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|  10 | povo-seikyu-kingaku-awanai-fix       | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
