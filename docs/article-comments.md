# 記事コメント機能

sim-hikari-guide.com の記事ページに、**ログイン不要・承認制**のコメント機能を提供する。

## アーキテクチャ

- **UI**: `ArticleComments.astro`（記事末尾、`RelatedArticles` の前）
- **クライアント JS**: `PUBLIC_COMMENTS_ENABLED=true` のときのみ script を出力。初期化は **IntersectionObserver**（`rootMargin: 200px`）でビューポート接近時に遅延。無効時は HTML/JS ともゼロコスト
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

Vercel → **Settings → Environment Variables**（**Production** に設定）:

| 変数                       | 値                   | 備考                                                         |
| -------------------------- | -------------------- | ------------------------------------------------------------ |
| `PUBLIC_COMMENTS_ENABLED`  | `true`               | ビルド時に UI に埋め込まれる。**変更後は再デプロイ必須**     |
| `COMMENTS_MODERATOR_TOKEN` | 下記参照             | **サーバー専用**（`PUBLIC_` なし）。クライアントに露出しない |
| `COMMENTS_IP_SALT`         | 任意のランダム文字列 | 未設定時は `"comments"` が使われる                           |

`KV_REST_API_URL` / `KV_REST_API_TOKEN` は KV 連携で自動注入される。

再デプロイ後に有効化。

#### `COMMENTS_MODERATOR_TOKEN` の設定（Vercel）

1. **生成**（ローカル端末）:
   ```bash
   openssl rand -hex 32
   ```
2. **Vercel に登録**: プロジェクト → **Settings → Environment Variables**
   - Name: `COMMENTS_MODERATOR_TOKEN`
   - Value: 生成した文字列
   - Environment: **Production**（Preview でもモデレーションする場合は Preview も）
   - **Sensitive** にチェック（値のマスク表示）
3. **再デプロイ**: 環境変数追加・変更後、Production を redeploy する
4. **動作確認**（トークン未設定・不一致は 401）:
   ```bash
   # ローカルでトークンを export（Vercel 登録値と同じ文字列）
   export COMMENTS_MODERATOR_TOKEN='（Vercel に登録した値）'
   curl -sS -X POST https://sim-hikari-guide.com/api/comments/moderate \
     -H "Authorization: Bearer $COMMENTS_MODERATOR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"action":"list"}'
   ```
   または `vercel env pull .env.local --environment=production` 後に `set -a && source .env.local && set +a` でも可。
   成功時: `{"comments":[...]}`（pending 一覧）

### 3. ローカル開発

#### 手動 `.env`（最小）

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

#### 本番 KV / トークンで CLI モデレーション（推奨）

Vercel CLI で Production 環境変数を pull し、**値をリポジトリにコミットしない**:

```bash
cd site
vercel link          # 初回のみ（プロジェクト blog-affiliate-pipeline / site）
vercel env pull .env.local --environment=production
```

`.env.local` は gitignore 済み。シェルでは **export せず**、dotenv 経由または 1 コマンド限定で使う:

```bash
cd site
set -a && source .env.local && set +a
npm run comments:moderate -- list
npm run comments:moderate -- approve <comment-id>
npm run comments:moderate -- reject <comment-id>
```

`COMMENTS_MODERATOR_TOKEN` は CLI スクリプトでは直接参照しないが、HTTP API 経由のモデレーション時に必要。

## 運用チェックリスト

### トークン保管のベストプラクティス

- **保存場所**: Vercel Environment Variables（Sensitive）を正本とする。ローカルは `site/.env.local`（gitignore）のみ
- **禁止**: `.env` のコミット、Slack/メール/スクショでの平文共有、Issue/PR への貼り付け
- **ローテーション**: 漏洩疑い時は Vercel で新値を設定 → redeploy → 旧トークンを削除
- **権限分離**: モデレーション用トークンは運営者のみ。CI や公開スクリプトには載せない
- **バックアップ**: パスワードマネージャー等に **1 箇所**だけ控える（Vercel UI から再表示できない場合に備える）

### 週次モデレーション（推奨フロー）

| 手順        | 操作                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| 1. 一覧     | `npm run comments:moderate -- list` または moderate API `{"action":"list"}` |
| 2. 確認     | スパム・誹謗・宣伝 URL・無関係内容を却下                                    |
| 3. 承認     | 有用なコメント: `approve <comment-id>`                                      |
| 4. 却下     | 不要: `reject <comment-id>`                                                 |
| 5. 公開確認 | 記事 URL で承認済みコメントが表示されるか確認                               |

**目安**: 週 1 回（月曜など）。pending が溜まったら随時。

POST `/api/comments` のレスポンスには **comment ID は含まれない**。ID は `list` で取得する（出力形式: `id\tslug\tauthor\tcreatedAt`）。

### 本番ヘルスチェック

```bash
# 承認済み一覧（200 + comments 配列）
curl -sS "https://sim-hikari-guide.com/api/comments?slug=au-denki-setwari"

# slug 省略: 有効化 + KV 設定済みなら 400（無効時は 200 + 空配列、KV 未設定は 503）
curl -sS "https://sim-hikari-guide.com/api/comments"

# UI: 記事末尾に「コメント」セクション（PUBLIC_COMMENTS_ENABLED=true かつ再デプロイ済み）
curl -sS "https://sim-hikari-guide.com/articles/au-denki-setwari" | grep -q article-comments
```

## 承認運用

### CLI（推奨）

```bash
cd site
# vercel env pull .env.local --environment=production の後:
set -a && source .env.local && set +a

npm run comments:moderate -- list
npm run comments:moderate -- approve <comment-id>
npm run comments:moderate -- reject <comment-id>
```

### HTTP API

```bash
# pending 一覧
curl -sS -X POST https://sim-hikari-guide.com/api/comments/moderate \
  -H "Authorization: Bearer $COMMENTS_MODERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"list"}'

# 承認
curl -sS -X POST https://sim-hikari-guide.com/api/comments/moderate \
  -H "Authorization: Bearer $COMMENTS_MODERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve","id":"<uuid>"}'

# 却下
curl -sS -X POST https://sim-hikari-guide.com/api/comments/moderate \
  -H "Authorization: Bearer $COMMENTS_MODERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"reject","id":"<uuid>"}'
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
