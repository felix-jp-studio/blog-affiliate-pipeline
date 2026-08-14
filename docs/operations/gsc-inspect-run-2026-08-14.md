# GSC 検査バッチ実行ログ（2026-08-14）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | ui+api                          |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 143                             |
| pending        | 82                              |
| indexed        | 61                              |
| 今回バッチ     | 10 / 90                         |
| 生成日時 (UTC) | 2026-08-14T00:59:02.864Z        |

## 結果

|   # | slug                         | UI              | API verdict | indexed | 備考                          |
| --: | ---------------------------- | --------------- | ----------- | :-----: | ----------------------------- |
|   1 | sim-tethering-settei-houhou  | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   2 | iijmio-kaituu-dekinai-fix    | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   3 | hikari-wifi-tsunagaranai-fix | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   4 | linemo-kaituu-dekinai-fix    | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   5 | uq-mobile-esim-settei-tejun  | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   6 | povo-esim-settei-tejun       | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   7 | nuro-hikari-kaiyaku-tejun    | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   8 | mineo-kaituu-dekinai-fix     | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   9 | ahamo-kaituu-dekinai-fix     | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|  10 | uq-mobile-kaituu-dekinai-fix | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
