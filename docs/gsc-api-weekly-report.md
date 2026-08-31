# GSC API → 週次 Markdown レポート

## 目的

Search Console Search Analytics を週次で取得し、Markdown レポートを生成する。  
シークレット未設定時は **exit 0 でスキップ**。認証がある場合は API を呼び、`docs/gsc-weekly/` に書き込む。

## スクリプト

```bash
npm run gsc:weekly-report
npm run gsc:weekly-report -- --dry-run
npm run gsc:weekly-report -- --fixture
```

- 実装: `scripts/gsc-weekly-report.mjs` / `scripts/gsc/search-analytics.mjs`
- 認証: 日次検査と同じ `scripts/gsc/auth.mjs`（SA JWT または OAuth）
- Workflow: `.github/workflows/gsc-weekly-report.yml`（月曜 09:00 JST + `workflow_dispatch` + `.github/trigger-gsc-weekly-report` push）

## 必要な Secrets / Vars（値は User が設定。Agent は発明しない）

| 名前                       | 種別           | 説明                                    |
| -------------------------- | -------------- | --------------------------------------- |
| `GSC_SITE_URL`             | Secret（任意） | 例: `https://sim-hikari-guide.com/`     |
| `GSC_SERVICE_ACCOUNT_JSON` | Secret         | Search Console 権限付き SA の JSON 全文 |
| `GSC_OAUTH_CLIENT_ID`      | Secret         | OAuth クライアント ID（SA の代替）      |
| `GSC_OAUTH_CLIENT_SECRET`  | Secret         | OAuth クライアントシークレット          |
| `GSC_OAUTH_REFRESH_TOKEN`  | Secret         | OAuth リフレッシュトークン              |

SA **または** OAuth の三点セットのいずれか一方で可。`GSC_SITE_URL` 未設定時は本番ドメイン既定値。403 のときは URL-prefix と `sc-domain:` を順に試す。

## 出力

- 既定: `docs/gsc-weekly/gsc-weekly-YYYYMMDD.md`（API 接続後。Workflow が main へ commit）
- Performance CSV: `data/gsc-performance-YYYYMMDD.csv`
- 11–30 位は `npm run gsc:import-rewrite-queue` で `data/rewrite-queue.csv` へ追記（Workflow が自動実行）
- `--fixture`: サンプル行のみ（本番数値なし）
- レポート内容: サイト全体のクリック/表示、上位クエリ、11–30 位のリライト候補

## 手動再実行（Agent 可）

`.github/trigger-gsc-weekly-report` に行を追加して main へマージする（日次検査の `.github/trigger-gsc-inspect` と同じ）。

## User 作業

1. 日次 GSC 検査と同じ Secrets があれば追加作業なし
2. 生成された `docs/gsc-weekly/gsc-weekly-*.md` の数値を GA4 / GSC 画面と突き合わせる
