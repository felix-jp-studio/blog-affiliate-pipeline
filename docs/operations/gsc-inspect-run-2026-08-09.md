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
| 生成日時 (UTC) | 2026-08-09T08:44:36.378Z |

## 結果

| # | slug | UI | API verdict | indexed | 備考 |
| -: | --- | --- | --- | :---: | --- |
| 1 | sim-fukukaisen-osusume | skipped | NEUTRAL | ⏳ | GSC returned error page (404?) for inspect URL — https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fsim-hikari-guide.com%2F&id=https%3A%2F%2Fsim-hikari-guide.com%2Farticles%2Fsim-fukukaisen-osusume |
| 2 | povo-speed-slow-fix | skipped | NEUTRAL | ⏳ | GSC returned error page (404?) for inspect URL — https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fsim-hikari-guide.com%2F&id=https%3A%2F%2Fsim-hikari-guide.com%2Farticles%2Fpovo-speed-slow-fix |
| 3 | sim-norikae-osusume | skipped | NEUTRAL | ⏳ | GSC returned error page (404?) for inspect URL — https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fsim-hikari-guide.com%2F&id=https%3A%2F%2Fsim-hikari-guide.com%2Farticles%2Fsim-norikae-osusume |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```

