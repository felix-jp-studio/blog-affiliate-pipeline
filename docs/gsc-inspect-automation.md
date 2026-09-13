# GSC 日次検査バッチ自動化

Search Console の **URL 検査 + インデックス登録リクエスト + キュー更新** を日次で自動実行する。

**本番運用中** — 毎日 09:00 JST、10 URL/回。詳細: [operations/gsc-inspect-production.md](./operations/gsc-inspect-production.md)

## コマンド

```bash
# Playwright セッション取得（初回・失効時）
npm install
npx playwright install chrome
npm run gsc:auth:login

# 日次バッチ（UI + API + キュー更新）
npm run gsc:inspect-batch -- --week-first --limit=10 --write-note

# dry-run（キューから batch 一覧のみ）
npm run gsc:inspect-batch -- --dry-run

# API のみ（Playwright なし）
npm run gsc:inspect-batch -- --api-only --write-note

# CI 相当（commit まで）
npm run gsc:inspect-batch -- --week-first --limit=10 --write-note --commit
```

従来の手動用リスト出力: `npm run gsc:inspection-batch`

## アーキテクチャ

```
日次 cron (09:00 JST, limit=10)
  → pending 10件取得 (data/gsc-index-queue.json, --week-first)
  → Playwright: GSC UI でインデックス登録リクエスト
  → URL Inspection API: 状態確認
  → verdict PASS → indexed: true 自動更新
  → ops note 生成 + git commit/push
```

Workflow: `.github/workflows/gsc-inspect-daily.yml`

## 必要な Secrets

| Secret                         | 必須                     | 説明                                             |
| ------------------------------ | ------------------------ | ------------------------------------------------ |
| `GSC_SERVICE_ACCOUNT_JSON`     | API 用 **必須**          | Search Console 権限付き SA JSON 全文             |
| `GSC_SITE_URL`                 | 推奨                     | `https://sim-hikari-guide.com/`（末尾 `/` 必須） |
| `GSC_PLAYWRIGHT_STORAGE_STATE` | UI 用 **必須（Goal B）** | `gsc-playwright-auth.json` を base64 化した値    |

OAuth 代替: `GSC_OAUTH_CLIENT_ID` / `GSC_OAUTH_CLIENT_SECRET` / `GSC_OAUTH_REFRESH_TOKEN`

詳細: [secrets.md](./secrets.md)

## 初回セットアップ

### 1. Service Account（API）

1. [GCP Console](https://console.cloud.google.com/) でプロジェクト作成
2. [Search Console API](https://console.cloud.google.com/apis/library/searchconsole.googleapis.com) を有効化
3. サービスアカウント作成 → JSON キーをダウンロード
4. [Search Console](https://search.google.com/search-console) → 設定 → ユーザーと権限 → SA メールを **完全** 権限で追加
5. GitHub Secrets に `GSC_SERVICE_ACCOUNT_JSON` と `GSC_SITE_URL` を登録

### 2. Playwright セッション（UI）

> **現状: UI 自動化は使えません（2026-09-13 時点）。**
> Google は codegen で起動した Chrome でもログインを拒否します（使い捨てプロファイル +
> `--remote-debugging-pipe` が自動操作として検出されるため）。
> このため日次バッチは `--api-only` で運用し、**インデックス登録リクエストは GSC UI から手動**で行います。
> 以下の手順は、Google 側の挙動が変わった場合の参考として残しています。

Google は Playwright スクリプト起動の Chrome でログインを拒否することがあります（「安全でない可能性があります」）。**codegen 方式**を使ってください。

```bash
npx playwright install chrome   # 初回のみ
npm run gsc:auth:login          # Chrome が開く → 手動ログイン → ウィンドウを閉じる
npm run gsc:verify-ui           # OK になるまで Secret は更新しない
base64 -i gsc-playwright-auth.json | tr -d '\n'  # → GSC_PLAYWRIGHT_STORAGE_STATE
```

| 症状                                       | 対処                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| メール入力後「安全でない可能性があります」 | `gsc:auth:login:legacy` ではなく **`npm run gsc:auth:login`**（codegen）を使う |
| verify-ui が FAILED                        | ログイン後に URL Inspection 画面まで進んでから Chrome を閉じる                 |
| codegen でもログインできない               | 現状の既定。UI 自動化は諦め、`--api-only` 運用 + 手動リクエストに切り替える    |

セッション失効時は上記を再実行して Secret を更新する。

## キュー拡張フィールド

`data/gsc-index-queue.json` の各 entry に追加:

| フィールド         | 説明                                                 |
| ------------------ | ---------------------------------------------------- |
| `indexRequestedAt` | UI リクエスト成功時刻                                |
| `lastInspectedAt`  | 最終 API 検査時刻                                    |
| `inspection`       | `{ verdict, coverageState, indexed, source: "api" }` |

## 制限・注意

- URL Inspection API: **2,000 回/日/プロパティ**
- GSC UI のインデックス登録リクエスト: **約 10 件/日**
- 公開直後は API が `NEUTRAL` のまま — 翌日以降に再検査
- UI セレクタ変更時は `docs/operations/gsc-inspect-screenshots/` に失敗スクショ保存

### API 403 (PERMISSION_DENIED) の対処

並行セットアップ: [operations/gsc-parallel-setup.md](./operations/gsc-parallel-setup.md)

1. `npm run gsc:verify-access` で SA が参照できるプロパティ一覧を確認
2. 一覧にプロパティが **無い** → GSC「ユーザーと権限」に SA の `client_email` を **完全** 権限で追加
3. 一覧にあるが 403 → `GSC_SITE_URL` の形式をプロパティ種類に合わせる:
   - URL プレフィックス: `https://sim-hikari-guide.com/`（末尾 `/` 必須）
   - ドメインプロパティ: `sc-domain:sim-hikari-guide.com`
4. Playwright UI が `skipped` → `npm run gsc:auth:login` でセッション再取得し Secret を更新

## 関連

- **本番運用**: [operations/gsc-inspect-production.md](./operations/gsc-inspect-production.md)
- 手動バッチメモ（旧）: `docs/operations/gsc-inspection-batch-*.md`
- 週次サマリー: `.github/workflows/gsc-inspection-weekly.yml`
- 公開後キュー投入: `.github/workflows/post-publish-index-queue.yml`

## インデックス登録リクエスト（手動運用）

UI 自動化がブロックされているため、未登録のまま滞留している記事は GSC UI から手動でリクエストします。

対象の洗い出し（`data/gsc-index-queue.json` の URL Inspection 実測を使う）:

```bash
node -e '
const d=require("./data/gsc-index-queue.json");
const now=Date.now();
d.entries
  .filter(e=>e.inspection&&e.inspection.verdict!=="PASS")
  .map(e=>({slug:e.slug,url:e.url,days:Math.floor((now-Date.parse(e.mergedAt))/86400000),state:e.inspection.coverageState}))
  .filter(e=>e.days>=27)
  .sort((a,b)=>b.days-a.days)
  .forEach(e=>console.log(`${e.days}日	${e.slug}	${e.state}`));
'
```

公開から27日未満の「検出 - インデックス未登録」は新規 URL の正常な通過状態なので、対処不要です。
30日以上滞留しているものだけを対象にしてください。手動リクエストは1日10件程度が上限の目安です。

> 手動リクエストはインデックス登録を保証しません。「検出 - インデックス未登録」は
> Google 側の品質・クロール予算の判断であり、リクエストだけでは動かないことが多い点に注意してください。
