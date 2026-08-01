# GSC API → 週次 Markdown レポート（スケルトン）

## 目的

Search Console Search Analytics を週次で取得し、Markdown レポートを生成する。  
現状は **シークレット未設定時に graceful skip** するスケルトン。

## スクリプト

```bash
npm run gsc:weekly-report
npm run gsc:weekly-report -- --dry-run
npm run gsc:weekly-report -- --fixture
```

- 実装: `scripts/gsc-weekly-report.mjs`
- Workflow: `.github/workflows/gsc-weekly-report.yml`（月曜 schedule + `workflow_dispatch`）

## 必要な Secrets / Vars（値は User が設定。Agent は発明しない）

| 名前                       | 種別             | 説明                                    |
| -------------------------- | ---------------- | --------------------------------------- |
| `GSC_SITE_URL`             | Variable（任意） | 例: `https://sim-hikari-guide.com/`     |
| `GSC_SERVICE_ACCOUNT_JSON` | Secret           | Search Console 権限付き SA の JSON 全文 |
| `GSC_OAUTH_CLIENT_ID`      | Secret           | OAuth クライアント ID（SA の代替）      |
| `GSC_OAUTH_CLIENT_SECRET`  | Secret           | OAuth クライアントシークレット          |
| `GSC_OAUTH_REFRESH_TOKEN`  | Secret           | OAuth リフレッシュトークン              |

SA **または** OAuth の三点セットのいずれか一方で可。未設定時は **exit 0 でスキップ**。

## 出力

- 既定: `docs/gsc-weekly/gsc-weekly-YYYYMMDD.md`（API 接続後）
- `--fixture`: サンプル行のみ（本番数値なし）
- 運用正本の手動ベースライン: `blog-affiliate-auto/docs/operations/gsc-baseline.md`

## 未実装（次イテレーション）

- Service Account JWT → access token
- `webmasters.searchanalytics.query` 呼び出し
- レポートを auto リポへ PR するオプション

## User 作業

1. GCP で Search Console API を有効化
2. SA を作成しプロパティにユーザー追加（または OAuth）
3. GitHub Actions Secrets に上記を登録
4. Agent に「GSC secrets 設定した」と連絡 → API 配線 PR
