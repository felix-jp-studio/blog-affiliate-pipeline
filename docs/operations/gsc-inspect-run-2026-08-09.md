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
| 生成日時 (UTC) | 2026-08-09T06:41:03.868Z |

## 結果

| # | slug | UI | API verdict | indexed | 備考 |
| -: | --- | --- | --- | :---: | --- |
| 1 | sim-fukukaisen-osusume | auth_required | NEUTRAL | ⏳ | Google sign-in required (url=https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fsearch.google.com%2Fsearch-console%2Finspect%3Fresource_id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2F%26id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2Farticles%2Fsim-fukukaisen-osusume&dsh=S37492071%3A1786257638778339&followup=https%3A%2F%2Fsearch.google.com%2Fsearch-console%2Finspect%3Fresource_id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2F%26id%3Dhttps%3A%2F%2Fsim-hikari-guide.com%2Farticles%2Fsim-fukukaisen-osusume&passive=1209600&service=sitemaps&flowName=WebLiteSignIn&flowEntry=ServiceLogin&ifkv=Ac50bxswxnsTl0CA1-1LkSWzN2vZRfNL-hviNK1i8ISK39NIQiKA66tPG6Xi0ZdLiDrfA8uAxrblgQ). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
| 2 | povo-speed-slow-fix | skipped | NEUTRAL | ⏳ |  |
| 3 | sim-norikae-osusume | skipped | NEUTRAL | ⏳ |  |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```

