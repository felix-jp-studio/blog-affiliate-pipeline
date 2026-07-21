# セットアップ

## サイト（Vercel）

[`docs/vercel-deploy.md`](vercel-deploy.md) を参照。`vercel.json` + CLI でデプロイ。

```bash
cd site
npm install
npm run dev
npm run build
```

本番ドメイン: `sim-hikari-guide.com`

## WordPress Application Password（WP 移行時のみ）

1. WordPress 管理画面 → ユーザー → プロフィール
2. 「アプリケーションパスワード」で新規作成（例: `blog-affiliate-pipeline`）
3. 生成されたパスワードを `.env` の `WP_APP_PASSWORD` に設定

## 環境変数

```bash
cp .env.example .env
```

| 変数              | 説明                             |
| ----------------- | -------------------------------- |
| `WP_URL`          | サイト URL（末尾スラッシュなし） |
| `WP_USER`         | WP ユーザー名                    |
| `WP_APP_PASSWORD` | Application Password             |

## 接続確認

```bash
npm install
npm run wp:ping
```

## 手動記事の投稿

**本番運用（現行）**: 記事は GitHub Actions の **Scheduled articles** ワークフロー（cron または [workflow_dispatch](./article-publish-schedule.md#手動実行workflow_dispatch)）で Markdown を生成し、PR → auto-merge → Vercel 反映する。下記の `wp:post` は WordPress 移行時のレガシー手順。

`drafts/` に Markdown を置き、frontmatter を付与:

```markdown
---
title: テスト記事タイトル
slug: test-article
articleType: howto
keywordId: 1
status: draft
---

本文（Markdown）
```

```bash
# dry-run
npm run wp:post -- --file drafts/test.md

# 投稿
npm run wp:post -- --file drafts/test.md --publish --status draft
```
