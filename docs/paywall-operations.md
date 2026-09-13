# 有料記事（ペイウォール）運用手順

自サイト `sim-hikari-guide.com` で、記事の後半を **記事ごとの買い切り** で販売する仕組み。
決済は Stripe Checkout、購入状態と有料本文の保管は Vercel KV。

## 設計の要点

| 項目             | 方針                                                                           |
| ---------------- | ------------------------------------------------------------------------------ |
| 課金モデル       | 記事ごとの買い切り（JPY・単品）                                                |
| 決済             | Stripe Checkout（`price_data` で都度生成。Stripe 側に商品登録は不要）          |
| 有料本文の保管   | **Vercel KV のみ**。本リポジトリは public なので git には絶対に入れない        |
| 無料パート       | 通常どおり静的生成され、SEO 対象になる                                         |
| 有料パート       | 静的 HTML には一切含まれず、購入者のリクエスト時にサーバーが描画して返す       |
| 購入者の識別     | 署名付き HttpOnly cookie（`pw_buyer`）。KV に purchase の集合を持つ            |
| 端末をまたぐ場合 | 購入完了時に表示される **復元コード**（例 `AB12-CD34-EF56`）を入力して引き継ぐ |

有料本文がビルド成果物に混ざらないことは構造的に保証される（`dist` を作る時点でサーバーは KV を読まない）。
加えて `npm run test:e2e:articles` が `drafts/premium/` の commit を検出したら失敗する。

## セットアップ（初回のみ）

1. Vercel KV を有効化（コメント機能と同じストアで良い）。`KV_REST_API_URL` / `KV_REST_API_TOKEN` は自動注入される。
2. Stripe のシークレットキーを取得し、Vercel の環境変数に設定する。

   | 変数                     | 値                                                                     |
   | ------------------------ | ---------------------------------------------------------------------- |
   | `PUBLIC_PAYWALL_ENABLED` | `true`（`false` の間は購入導線が出ず、無料パートだけ表示）             |
   | `STRIPE_SECRET_KEY`      | Stripe のシークレットキー（テストは `sk_test_...`）                    |
   | `PAYWALL_TOKEN_SECRET`   | `openssl rand -base64 32` で生成。**変えると全購入者の cookie が失効** |
   | `STRIPE_WEBHOOK_SECRET`  | 手順 3 で発行される `whsec_...`                                        |

3. Stripe ダッシュボードで webhook エンドポイントを登録する（→ [次章](#stripe-webhook-の登録手順)）。

4. Stripe ダッシュボードで日本円決済を有効にしておく。コンビニ払い・銀行振込のような
   後払い決済を有効にする場合も、入金完了時に webhook が解放するので追加設定は不要。

## Stripe webhook の登録手順

### 前提：テストモードと本番モードは別世界

Stripe はテスト（`sk_test_...`）と本番（`sk_live_...`）で API キーも webhook の署名シークレットも完全に別。
**`STRIPE_SECRET_KEY` と `STRIPE_WEBHOOK_SECRET` は必ず同じモードの組で使う。**
混ざると、署名検証（webhook）か Checkout セッション取得（`/api/paywall/unlock`）のどちらかが必ず失敗する。

### 1. Webhooks 画面を開く

<https://dashboard.stripe.com/webhooks>（テストモードは <https://dashboard.stripe.com/test/webhooks>）。

ダッシュボードのバージョンによって導線が違うが、行き先は同じ。

- 旧: 右上「開発者 / Developers」→「Webhooks」
- 新: 右上「Workbench」→「Webhooks」タブ

本番用を登録するときは、右上のテストモードのトグルが **OFF** になっていることを確認する。

### 2. エンドポイントを追加する

「エンドポイントを追加 / Add endpoint」を押し、**エンドポイント URL** に次を入力する。

```
https://sim-hikari-guide.com/api/paywall/webhook
```

> **末尾スラッシュと `www.` を付けないこと。** このサイトは `trailingSlash: "never"` と
> `site/vercel.json` の www → apex リダイレクトが効くため、`.../webhook/` や
> `https://www.sim-hikari-guide.com/...` は 308 リダイレクトになる。
> Stripe は webhook 配信でリダイレクトを追わないので、そのまま配信失敗として記録される。

### 3. 送信イベントを選ぶ

「イベントを選択 / Select events」で、検索窓に `checkout.session` と入れて次の 2 つだけを選ぶ。

| イベント                                   | 何のために要るか                                             |
| ------------------------------------------ | ------------------------------------------------------------ |
| `checkout.session.completed`               | カード決済など、その場で入金が完了する決済                   |
| `checkout.session.async_payment_succeeded` | コンビニ払い・銀行振込など、後から入金される決済の入金完了時 |

「すべてのイベントを送信」は選ばない（無関係なイベントで無駄に関数が起動する）。
Connect 用の「連結アカウントのイベントを送信」も不要。

### 4. 署名シークレットを取得して Vercel に設定する

作成後のエンドポイント詳細ページで「署名シークレット / Signing secret」の **「表示」** を押し、
`whsec_...` をコピーする。

Vercel → 対象プロジェクト → **Settings → Environment Variables** で
`STRIPE_WEBHOOK_SECRET` として追加する。本番モードのシークレットは **Production** スコープに入れる。

> 環境変数は既存のデプロイには反映されない。追加したら **再デプロイする**。

### 5. 動作確認

エンドポイント詳細ページの「テストイベントを送信 / Send test webhook」で
`checkout.session.completed` を送る。期待するレスポンスは次のとおり。

```json
{ "received": true, "granted": false }
```

`granted: false` で正しい。テストイベントには `metadata.slug` / `metadata.buyerId` が入っていないため、
解放対象として扱わないのが期待動作（[`src/lib/paywall/webhook.ts`](../site/src/lib/paywall/webhook.ts)）。

解放まで通しで確認したいときは、テストモードで実際にテストカード `4242 4242 4242 4242` で購入する。

### 6. ローカルで試す場合

ローカルには Stripe から到達できないので、Stripe CLI で転送する。

```bash
brew install stripe-cli   # 未インストールなら（公式ドキュメントの独自 tap 版は不要）
stripe login
```

#### 環境変数を `process.env` に載せてから dev サーバーを起動する

`site/.env` を置くだけでは**足りない**。Astro（Vite）は `.env` を `import.meta.env` にしか載せないため、
`process.env` を読むサーバー側コード（Stripe キー・`PAYWALL_TOKEN_SECRET`・`@vercel/kv` の接続情報）からは見えず、
エンドポイントが 503 `Paywall is not configured.` を返す。

`.env` をシェルに読み込んでから起動する。

```bash
cd site
set -a; . ./.env; set +a
npm run dev
```

`site/.env` に入れる内容:

```
PUBLIC_PAYWALL_ENABLED=true
STRIPE_SECRET_KEY=sk_test_...        # テストモードのシークレットキー
STRIPE_WEBHOOK_SECRET=whsec_...      # 下の stripe listen が表示するもの
PAYWALL_TOKEN_SECRET=...             # openssl rand -base64 32
KV_REST_API_URL=...                  # vercel env pull などで取得
KV_REST_API_TOKEN=...
```

#### 転送とイベント送信

```bash
stripe listen --forward-to localhost:4321/api/paywall/webhook
```

`stripe listen` が表示する `whsec_...` は **CLI 専用の一時シークレット**で、ダッシュボードのものとは別。
これを `site/.env` の `STRIPE_WEBHOOK_SECRET` に入れ、dev サーバーを起動し直す。

別ターミナルで:

```bash
stripe trigger checkout.session.completed
```

疎通だけ確かめるなら、署名なしで叩いて 400 が返れば環境変数は読めている
（503 が返るなら `.env` がシェルに読み込まれていない）。

```bash
curl -i -X POST localhost:4321/api/paywall/webhook -d '{}'
# 400 {"error":"Missing stripe-signature header."}  ← 正常
# 503 {"error":"Paywall webhook is not configured."} ← 環境変数が見えていない
```

### つまずきやすいところ

| 症状                                        | 原因と対処                                                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 配信が 307/308 で失敗する                   | URL に末尾スラッシュか `www.` が付いている。apex ドメイン・スラッシュ無しで登録し直す                                                            |
| 400 `Signature verification failed.`        | `STRIPE_WEBHOOK_SECRET` がモード違い、または設定後に再デプロイしていない                                                                         |
| 503 `Paywall webhook is not configured.`    | `STRIPE_WEBHOOK_SECRET` / `STRIPE_SECRET_KEY` / KV のいずれかが未設定。ローカルなら `.env` をシェルに読み込まずに `npm run dev` した可能性が高い |
| Preview デプロイに配信できない              | Vercel の Deployment Protection が Preview URL を保護している。本番 URL で検証する                                                               |
| 同じ URL にテスト用と本番用の両方を登録した | 署名シークレットは 1 つしか設定できないので必ず片方が 400 になる。ローカルは `stripe listen`、本番 URL は本番モードのみにする                    |

配信結果はエンドポイント詳細ページのイベント一覧で HTTP ステータスとレスポンス本文まで確認でき、
失敗したものは「再送 / Resend」できる。Stripe 側も数日間は指数バックオフで自動再送する。

## 有料記事を1本出す

### 1. 記事（無料パート）に価格を書く

`site/src/content/articles/<slug>.md` の frontmatter に追記する。

```yaml
paywallPrice: 980
paywallTeaser: "続きでは、実際の申込画面つきで手順を解説します。"
```

- `paywallPrice`: 100〜50000 の整数（円）。この値が課金額の唯一の出どころ。
- `paywallTeaser`: 省略可。ペイウォールに出す一文（200文字以内）。

無料パートの本文はここまでで完結させる。ペイウォールは本文の直後に差し込まれる。

### 2. 有料パートを書く

`drafts/premium/<slug>.md` に Markdown 本文だけを書く（frontmatter は不要）。
このディレクトリは gitignore 済みで、コミットされない。

記事本文と同じ remark/rehype パイプラインを通すので、見出し・表・`{AFFILIATE:...}` 記法も同じように使える。

### 3. KV へ push する

```bash
# 中身と価格の確認だけ（KV には書かない）
npm run paywall -- push <slug> --dry-run

# 反映
KV_REST_API_URL=... KV_REST_API_TOKEN=... npm run paywall -- push <slug>
```

価格・タイトルは記事 frontmatter から読み直して KV に同期されるので、**値上げ・値下げは frontmatter を直して push し直す**。

```bash
npm run paywall -- list            # 登録済みの有料記事一覧
npm run paywall -- remove <slug>   # 販売停止（本文と価格を KV から削除）
```

### 4. 公開

記事をいつもどおりマージ・デプロイする。`PUBLIC_PAYWALL_ENABLED=true` なら購入導線が表示される。

## 購入者から見た動き

1. 記事末尾のペイウォールで「◯◯円で続きを読む」→ Stripe Checkout へ遷移
2. 決済完了 → 記事に戻り、有料パートがその場で開く。同時に復元コードが表示される
3. 再訪時は cookie で自動的に開く（復元コードは有料パート下部の「復元コード」から確認できる）
4. 別端末・cookie 削除後は、ペイウォールの「購入済みの方」から復元コードを入力

決済後に記事へ戻らなかった場合や、コンビニ払い・銀行振込で後から入金された場合は、
webhook が購入を確定させる。購入者は記事を開き直すだけで有料パートが読める
（購入者 cookie は Checkout へ遷移する時点で発行済みのため）。

## API

| エンドポイント               | 用途                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| `POST /api/paywall/checkout` | Stripe Checkout セッションを作り URL を返す                 |
| `GET /api/paywall/unlock`    | 決済直後、`session_id` を購入証明として解放＋復元コード発行 |
| `GET /api/paywall/content`   | 購入済み cookie を持つ再訪者に有料本文を返す                |
| `POST /api/paywall/restore`  | 復元コードから購入者 cookie を再発行                        |

いずれも `PUBLIC_PAYWALL_ENABLED` が false のときは 404、Stripe/KV 未設定なら 503 を返す。

## 運用上の注意

- **`PAYWALL_TOKEN_SECRET` を変更しない。** 変更すると既存購入者の cookie が無効になり、全員が復元コード入力を求められる。
- 有料本文を GitHub に置かない。`drafts/premium/` 以外に置く場合も、必ず gitignore 済みの場所にする。
- 返金は Stripe ダッシュボードで行う。アクセス剥奪が必要な場合は KV の `paywall:grants:<buyerId>` から該当 slug を削除する。
- webhook の配信失敗は Stripe ダッシュボードの「Webhooks」で確認・再送できる。解放されない購入の調査はまずここを見る。
