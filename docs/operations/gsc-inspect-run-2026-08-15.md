# GSC 検査バッチ実行ログ（2026-08-15）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | ui+api                          |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 144                             |
| pending        | 77                              |
| indexed        | 67                              |
| 今回バッチ     | 10 / 83                         |
| 生成日時 (UTC) | 2026-08-15T00:35:02.059Z        |

## 結果

|   # | slug                             | UI              | API verdict | indexed | 備考                          |
| --: | -------------------------------- | --------------- | ----------- | :-----: | ----------------------------- |
|   1 | sim-tethering-settei-houhou      | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   2 | iijmio-kaituu-dekinai-fix        | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   3 | mineo-esim-settei-tejun          | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   4 | linemo-esim-settei-tejun         | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   5 | povo-kaiyaku-tejun               | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   6 | povo-kaituu-dekinai-fix          | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   7 | wimax-speed-slow-fix             | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   8 | home-router-speed-slow-fix       | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   9 | mineo-kaiyaku-tejun              | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|  10 | rakuten-mobile-esim-settei-tejun | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
