# GSC 検査バッチ実行ログ（2026-08-09）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目 | 値 |
| --- | --- |
| モード | ui+api |
| プロパティ | `https://sim-hikari-guide.com/` |
| キュー合計 | 109 |
| pending | 81 |
| indexed | 28 |
| 今回バッチ | 3 / 81 |
| 生成日時 (UTC) | 2026-08-09T05:45:12.168Z |

## 結果

| # | slug | UI | API verdict | indexed | 備考 |
| -: | --- | --- | --- | :---: | --- |
| 1 | sim-fukukaisen-osusume | skipped | — | ⏳ | API error: URL Inspection API 403: {"error":{"code":403,"message":"You do not own this site, or the inspected URL is not part of this property.","status":"PERMISSION_DENIED"}} |
| 2 | povo-data-yoryou-tsuika-houhou | skipped | — | ⏳ | API error: URL Inspection API 403: {"error":{"code":403,"message":"You do not own this site, or the inspected URL is not part of this property.","status":"PERMISSION_DENIED"}} |
| 3 | povo-speed-slow-fix | skipped | — | ⏳ | API error: URL Inspection API 403: {"error":{"code":403,"message":"You do not own this site, or the inspected URL is not part of this property.","status":"PERMISSION_DENIED"}} |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```

