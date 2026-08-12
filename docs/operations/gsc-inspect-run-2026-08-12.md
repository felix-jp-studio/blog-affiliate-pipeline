# GSC 検査バッチ実行ログ（2026-08-12）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | ui+api                          |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 142                             |
| pending        | 97                              |
| indexed        | 45                              |
| 今回バッチ     | 10 / 104                        |
| 生成日時 (UTC) | 2026-08-12T00:57:20.555Z        |

## 結果

|   # | slug                        | UI              | API verdict | indexed | 備考                          |
| --: | --------------------------- | --------------- | ----------- | :-----: | ----------------------------- |
|   1 | povo-speed-slow-fix         | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   2 | wimax-kaiyaku-dekinai-fix   | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   3 | sim-tethering-settei-houhou | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   4 | rakuten-mobile-mnp-tejun    | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   5 | linemo-kaiyaku-tejun        | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   6 | sim-tsunagaranai-fix        | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   7 | hikari-kaituu-slow-fix      | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   8 | iijmio-kaituu-dekinai-fix   | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   9 | hikari-kaituu-junbi-tejun   | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|  10 | sim-kishu-henkou-tejun      | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
