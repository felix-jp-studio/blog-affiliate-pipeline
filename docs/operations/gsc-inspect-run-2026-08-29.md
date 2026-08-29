# GSC 検査バッチ実行ログ（2026-08-29）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | ui+api                          |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 157                             |
| pending        | 47                              |
| indexed        | 110                             |
| 今回バッチ     | 10 / 51                         |
| 生成日時 (UTC) | 2026-08-29T04:34:08.849Z        |

## 結果

|   # | slug                           | UI            | API verdict | indexed | 備考                                                                                                                                                                                                                                                                                                |
| --: | ------------------------------ | ------------- | ----------- | :-----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | 5g-sim-speed-hikaku            | auth_required | PASS        |   ✅    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   2 | mineo-esim-settei-houhou       | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   3 | docomo-hikari-speed-slow-fix   | auth_required | PASS        |   ✅    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   4 | 5g-taiou-smartphone-sim-hikaku | auth_required | PASS        |   ✅    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   5 | iijmio-esim-settei-houhou      | auth_required | PASS        |   ✅    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   6 | rakuten-mobile-switch          | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   7 | sim-20gb-osusume               | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   8 | sim-tuuwa-teigaku-hikaku       | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   9 | sim-fukukaisen-osusume         | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|  10 | sim-tethering-settei-houhou    | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
