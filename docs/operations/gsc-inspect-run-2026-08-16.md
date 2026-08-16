# GSC 検査バッチ実行ログ（2026-08-16）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | ui+api                          |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 145                             |
| pending        | 72                              |
| indexed        | 73                              |
| 今回バッチ     | 10 / 78                         |
| 生成日時 (UTC) | 2026-08-16T00:37:58.722Z        |

## 結果

|   # | slug                                  | UI              | API verdict | indexed | 備考                          |
| --: | ------------------------------------- | --------------- | ----------- | :-----: | ----------------------------- |
|   1 | sim-tethering-settei-houhou           | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   2 | iijmio-kaituu-dekinai-fix             | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   3 | povo-kaiyaku-tejun                    | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   4 | rakuten-mobile-esim-settei-tejun      | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   5 | iijmio-esim-settei-tejun              | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   6 | esim-profile-sakujo-dekinai-fix       | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   7 | mnp-yoyaku-bangou-shutoku-dekinai-fix | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   8 | mineo-speed-slow-fix                  | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   9 | softbank-hikari-kaiyaku-tejun         | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|  10 | uq-mobile-kishu-henkou-tejun          | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
