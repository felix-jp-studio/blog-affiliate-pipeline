# GSC 検査バッチ実行ログ（2026-08-13）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | ui+api                          |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 142                             |
| pending        | 89                              |
| indexed        | 53                              |
| 今回バッチ     | 10 / 97                         |
| 生成日時 (UTC) | 2026-08-13T01:00:22.766Z        |

## 結果

|   # | slug                         | UI              | API verdict | indexed | 備考                          |
| --: | ---------------------------- | --------------- | ----------- | :-----: | ----------------------------- |
|   1 | sim-tethering-settei-houhou  | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   2 | iijmio-kaituu-dekinai-fix    | already_indexed | NEUTRAL     |   ⏳    | URL appears indexed in GSC UI |
|   3 | tethering-dekinai-fix        | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   4 | mnp-error-fix                | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   5 | ahamo-speed-slow-fix         | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   6 | nuro-hikari-tsunagaranai-fix | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   7 | docomo-kaiyaku-tejun         | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   8 | biglobe-hikari-kaiyaku-tejun | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|   9 | ahamo-esim-settei-tejun      | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |
|  10 | sim-kengai-hyoji-fix         | already_indexed | PASS        |   ✅    | URL appears indexed in GSC UI |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
