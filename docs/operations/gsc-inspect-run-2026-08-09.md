# GSC 検査バッチ実行ログ（2026-08-09）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目 | 値 |
| --- | --- |
| モード | ui+api |
| プロパティ | `https://sim-hikari-guide.com/` |
| キュー合計 | 130 |
| pending | 101 |
| indexed | 29 |
| 今回バッチ | 3 / 101 |
| 生成日時 (UTC) | 2026-08-09T08:56:47.414Z |

## 結果

| # | slug | UI | API verdict | indexed | 備考 |
| -: | --- | --- | --- | :---: | --- |
| 1 | sim-fukukaisen-osusume | already_indexed | NEUTRAL | ⏳ | URL appears indexed in GSC UI |
| 2 | povo-speed-slow-fix | already_indexed | NEUTRAL | ⏳ | URL appears indexed in GSC UI |
| 3 | sim-norikae-osusume | already_indexed | NEUTRAL | ⏳ | URL appears indexed in GSC UI |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```

