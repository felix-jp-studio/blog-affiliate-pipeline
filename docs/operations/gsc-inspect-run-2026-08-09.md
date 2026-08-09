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
| 生成日時 (UTC) | 2026-08-09T06:57:04.484Z |

## 結果

| # | slug | UI | API verdict | indexed | 備考 |
| -: | --- | --- | --- | :---: | --- |
| 1 | sim-fukukaisen-osusume | auth_required | NEUTRAL | ⏳ | Google sign-in required (url=https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fsearch.google.com%2Fsearch-console%2Finspect%3Fresource_id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2F%26id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2Farticles%2Fsim-fukukaisen-osusume&dsh=S-2027976278%3A1786258593053886&followup=https%3A%2F%2Fsearch.google.com%2Fsearch-console%2Finspect%3Fresource_id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2F%26id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2Farticles%2Fsim-fukukaisen-osusume&passive=1209600&service=sitemaps&flowName=WebLiteSignIn&flowEntry=ServiceLogin&ifkv=Ac50bxvpPxnbvIHGzdtDyIdl2uvG6yliV2kBrawo1lj-qxS20iERkHVUyHRKsMpJ-KJLx-B2GptQ). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
| 2 | povo-speed-slow-fix | auth_required | NEUTRAL | ⏳ | Google sign-in required (url=https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fsearch.google.com%2Fsearch-console%2Finspect%3Fresource_id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2F%26id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2Farticles%2Fpovo-speed-slow-fix&dsh=S-2027976278%3A1786258595738219&followup=https%3A%2F%2Fsearch.google.com%2Fsearch-console%2Finspect%3Fresource_id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2F%26id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2Farticles%2Fpovo-speed-slow-fix&passive=1209600&service=sitemaps&flowName=WebLiteSignIn&flowEntry=ServiceLogin&ifkv=Ac50bxt1rexB1dbDntaPzzMrq6jctiPTL4z0KN3UsoW-Ugmuwsx57PY9qWc98lc8kf8pFky9dcGNQw). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
| 3 | sim-norikae-osusume | auth_required | NEUTRAL | ⏳ | Google sign-in required (url=https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fsearch.google.com%2Fsearch-console%2Finspect%3Fresource_id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2F%26id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2Farticles%2Fsim-norikae-osusume&dsh=S-938806788%3A1786258598507954&followup=https%3A%2F%2Fsearch.google.com%2Fsearch-console%2Finspect%3Fresource_id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2F%26id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2Farticles%2Fsim-norikae-osusume&passive=1209600&service=sitemaps&flowName=WebLiteSignIn&flowEntry=ServiceLogin&ifkv=Ac50bxu5DeFH6Z7PpKnuoLBsy_t0Sh1trDBHk3kS27N3mePQWG10EdsFto2YBmvYZ848LVuJNAV42A). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```

