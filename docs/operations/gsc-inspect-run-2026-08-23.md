# GSC 検査バッチ実行ログ（2026-08-23）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | ui+api                          |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 151                             |
| pending        | 48                              |
| indexed        | 103                             |
| 今回バッチ     | 10 / 52                         |
| 生成日時 (UTC) | 2026-08-23T00:37:22.365Z        |

## 結果

|   # | slug                           | UI            | API verdict | indexed | 備考                                                                                                                                                                                                                                                                                                |
| --: | ------------------------------ | ------------- | ----------- | :-----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | hikkoshi-hikari-denki-set      | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   2 | nuro-hikari-kaiyaku-kin-hikaku | auth_required | PASS        |   ✅    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   3 | linemo-esim-settei-houhou      | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   4 | rakuten-mobile-switch          | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   5 | sim-20gb-osusume               | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   6 | sim-tuuwa-teigaku-hikaku       | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   7 | hikkoshi-hikari-tetsuzuki      | auth_required | PASS        |   ✅    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   8 | softbank-hikari-shogai-kakunin | auth_required | PASS        |   ✅    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   9 | au-denki-fee-hikaku            | auth_required | PASS        |   ✅    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|  10 | sim-fukukaisen-osusume         | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
