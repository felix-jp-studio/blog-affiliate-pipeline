# GA4 / Search Console セットアップ

## 環境変数（Vercel）

| 変数                         | 説明                                         | 例                             |
| ---------------------------- | -------------------------------------------- | ------------------------------ |
| `PUBLIC_GA_MEASUREMENT_ID`   | GA4 測定 ID                                  | `G-XXXXXXXXXX`                 |
| `PUBLIC_GSC_VERIFICATION`    | GSC 所有権確認用 meta 内容                   | `abc123...`                    |
| `PUBLIC_CONTACT_FORM_ACTION` | お問い合わせフォーム POST 先（Formspree 等） | `https://formspree.io/f/xxxxx` |
| `PUBLIC_CONTACT_EMAIL`       | フォーム未設定時の mailto 表示用             | `contact@example.com`          |

Vercel → `sim-hikari-guide-site` → Settings → Environment Variables で **Production** に設定。

## GA4 手順

1. https://analytics.google.com/ でプロパティ作成
2. データストリーム → ウェブ → URL: `https://sim-hikari-guide.com`
3. 測定 ID（`G-...`）を `PUBLIC_GA_MEASUREMENT_ID` に設定
4. 再デプロイ後、リアルタイムレポートでアクセス確認

## Search Console 手順

1. https://search.google.com/search-console でプロパティ追加
2. **ドメイン** または **URL プレフィックス**（`https://sim-hikari-guide.com`）を選択
3. 所有権確認:
   - **HTML タグ** を選び、content 値を `PUBLIC_GSC_VERIFICATION` に設定 → 再デプロイ
   - または Cloud DNS に TXT レコードを追加（ドメイン確認の場合）
4. サイトマップ送信: `https://sim-hikari-guide.com/sitemap-index.xml`（Astro ビルド後に生成）

## お問い合わせフォーム（Formspree 例）

1. https://formspree.io/ で無料アカウント作成
2. 新規フォーム → エンドポイント URL を `PUBLIC_CONTACT_FORM_ACTION` に設定
3. 再デプロイ後、`/contact` からテスト送信
