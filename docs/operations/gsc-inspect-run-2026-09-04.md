# GSC 検査バッチ実行ログ（2026-09-04）

> 自動生成 — `scripts/gsc/inspect-batch.mjs`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| モード         | ui+api                          |
| プロパティ     | `https://sim-hikari-guide.com/` |
| キュー合計     | 163                             |
| pending        | 44                              |
| indexed        | 119                             |
| 今回バッチ     | 10 / 47                         |
| 生成日時 (UTC) | 2026-09-04T01:47:50.871Z        |

## 結果

|   # | slug                              | UI            | API verdict | indexed | 備考                                                                                                                                                                                                                                                                                                |
| --: | --------------------------------- | ------------- | ----------- | :-----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | povo-topping-kaiyaku-houhou       | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   2 | ahamo-oomori-option-fuyou         | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   3 | senior-smartphone-sim-hikaku-2026 | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   4 | rakuten-mobile-switch             | auth_required | PASS        |   ✅    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   5 | sim-20gb-osusume                  | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   6 | sim-tuuwa-teigaku-hikaku          | auth_required | PASS        |   ✅    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   7 | sim-fukukaisen-osusume            | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   8 | sim-tethering-settei-houhou       | auth_required | PASS        |   ✅    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|   9 | iijmio-kaituu-dekinai-fix         | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |
|  10 | povo-kaiyaku-tejun                | auth_required | NEUTRAL     |   ⏳    | Google sign-in required (url=https://search.google.com/search-console/not-verified?original_url=/search-console?resource_id%3Dhttps://sim-hikari-guide.com/&original_resource_id=https://sim-hikari-guide.com/). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE. |

## コマンド

```bash
npm run gsc:inspect-batch -- --week-first --limit=10
npm run gsc:auth:login
```
