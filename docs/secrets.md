# GitHub Secrets

Phase 0 で必要:

| Secret            | 説明                 |
| ----------------- | -------------------- |
| `WP_URL`          | WordPress サイト URL |
| `WP_USER`         | WP ユーザー名        |
| `WP_APP_PASSWORD` | Application Password |

Phase 1 で追加:

| Secret         | 説明     |
| -------------- | -------- |
| `GROQ_API_KEY` | 記事生成 |

訪問性（Phase V1）:

| Secret / Env   | 設定先                          | 説明                                        |
| -------------- | ------------------------------- | ------------------------------------------- |
| `INDEXNOW_KEY` | GitHub Actions Secrets + Vercel | IndexNow 検証キー（未設定時 ping スキップ） |

GSC 週次レポート（スケルトン・未設定時 skip）:

| Secret / Env               | 設定先                  | 説明                                           |
| -------------------------- | ----------------------- | ---------------------------------------------- |
| `GSC_SITE_URL`             | Actions Secrets（任意） | プロパティ URL。未設定時は本番ドメイン既定値   |
| `GSC_SERVICE_ACCOUNT_JSON` | Actions Secrets         | Search Console 権限付きサービスアカウント JSON |
| `GSC_OAUTH_CLIENT_ID`      | Actions Secrets         | OAuth（SA の代替）                             |
| `GSC_OAUTH_CLIENT_SECRET`  | Actions Secrets         | OAuth                                          |
| `GSC_OAUTH_REFRESH_TOKEN`  | Actions Secrets         | OAuth                                          |

GSC 日次検査バッチ（[gsc-inspect-automation.md](./gsc-inspect-automation.md)）:

| Secret / Env                   | 設定先          | 説明                                              |
| ------------------------------ | --------------- | ------------------------------------------------- |
| `GSC_PLAYWRIGHT_STORAGE_STATE` | Actions Secrets | `npm run gsc:auth:login` 出力 JSON の base64 全文 |

詳細: [gsc-api-weekly-report.md](./gsc-api-weekly-report.md) / [gsc-inspect-automation.md](./gsc-inspect-automation.md)

登録: Settings → Secrets and variables → Actions
