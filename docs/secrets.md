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

詳細: [indexnow.md](./indexnow.md)

登録: Settings → Secrets and variables → Actions
