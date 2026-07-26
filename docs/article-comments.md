# 記事コメント機能

sim-hikari-guide.com の記事ページに、**ログイン不要・承認制**のコメント機能を提供する。

## アーキテクチャ

- **UI**: `ArticleComments.astro`（記事末尾、`RelatedArticles` の前）
- **API**: Astro server endpoints（Vercel Serverless）
  - `GET /api/comments?slug=` — 承認済み一覧
  - `POST /api/comments` — pending 投稿
  - `POST /api/comments/moderate` — 承認 / 却下（要 token）
- **ストレージ**: Vercel KV

## 環境変数（Vercel Production）

| 変数                       | 必須 | 説明                                  |
| -------------------------- | ---- | ------------------------------------- |
| `PUBLIC_COMMENTS_ENABLED`  | はい | `true` で UI/API 有効                 |
| `KV_REST_API_URL`          | はい | Vercel KV 連携で自動注入              |
| `KV_REST_API_TOKEN`        | はい | 同上                                  |
| `COMMENTS_MODERATOR_TOKEN` | はい | 承認 API / CLI 用（ランダム長文字列） |
| `COMMENTS_IP_SALT`         | 推奨 | IP ハッシュ用 salt                    |

## セットアップ手順

### 1. Vercel KV 作成

1. [Vercel Dashboard](https://vercel.com/) → プロジェクト `blog-affiliate-pipeline`（site）
2. **Storage** → **Create Database** → **KV**
3. プロジェクトに **Connect**

### 2. 環境変数

Vercel → **Settings → Environment Variables**:

- `PUBLIC_COMMENTS_ENABLED` = `true`
- `COMMENTS_MODERATOR_TOKEN` = （`openssl rand -hex 32` 等）
- `COMMENTS_IP_SALT` = （任意のランダム文字列）

再デプロイ後に有効化。

### 3. ローカル開発

`site/.env`:

```env
PUBLIC_COMMENTS_ENABLED=true
KV_REST_API_URL=
KV_REST_API_TOKEN=
COMMENTS_MODERATOR_TOKEN=dev-token
COMMENTS_IP_SALT=local-dev
```

KV 未設定時は API が 503、UI は表示されるが投稿不可。

```bash
cd site && npm run dev
```

## 承認運用

### CLI（推奨）

```bash
cd site
export KV_REST_API_URL=...
export KV_REST_API_TOKEN=...

npm run comments:moderate -- list
npm run comments:moderate -- approve <comment-id>
npm run comments:moderate -- reject <comment-id>
```

### HTTP API

```bash
curl -X POST https://sim-hikari-guide.com/api/comments/moderate \
  -H "Authorization: Bearer $COMMENTS_MODERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve","id":"<uuid>"}'
```

## スパム対策

- honeypot フィールド（`website`）
- IP ハッシュ + rate limit（1 時間あたり 3 件 / 記事 / IP）
- 承認制（pending のみ保存、approved のみ公開）

## テスト

```bash
cd site && node --test tests/comments-validation.test.mjs
npm test  # リポジトリルート（generator + site comments）
```
