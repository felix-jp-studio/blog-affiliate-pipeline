# blog-affiliate-pipeline

格安 SIM × 光回線 × お困り系アフィリエイトの記事生成・公開パイプライン。

## 設計書

[blog-affiliate-auto/docs/plans/blog-affiliate-pipeline-design.md](https://github.com/felix-jp-studio/blog-affiliate-auto/blob/main/docs/plans/blog-affiliate-pipeline-design.md)

## 構成

| パス                     | 用途                                              |
| ------------------------ | ------------------------------------------------- |
| `site/`                  | Astro 静的サイト（Vercel デプロイ先）             |
| `packages/publisher`     | 記事公開 CLI（Phase 0: WP / 将来: Markdown 公開） |
| `config/`                | プロンプト・アフィリエイトルール・品質閾値        |
| `data/keywords.seed.csv` | KW サンプル                                       |

## サイト（Vercel）

**リポジトリ**: `felix-jp-studio/blog-affiliate-pipeline`  
**Root Directory**: `site`  
**本番ドメイン**: `sim-hikari-guide.com`

```bash
cd site
npm install
npm run dev      # ローカル開発 http://localhost:4321
npm run build    # ビルド確認
```

### Vercel 設定

| 項目             | 値              |
| ---------------- | --------------- |
| Framework Preset | Astro           |
| Root Directory   | `site`          |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |
| Install Command  | `npm install`   |

## Phase 0（publisher）

- `packages/publisher` — WordPress REST 投稿（`wp:ping` / `wp:post`）
- 静的サイト運用時は `site/content/articles/` への Markdown 公開に移行予定

## セットアップ（ルート）

```bash
npm install
cp .env.example .env
# WP 利用時のみ: WP_URL / WP_USER / WP_APP_PASSWORD を設定
npm run wp:ping
```

## コマンド

| コマンド                                                               | 説明                  |
| ---------------------------------------------------------------------- | --------------------- |
| `npm run wp:ping`                                                      | WordPress 接続確認    |
| `npm run wp:post -- --file drafts/article.md`                          | 下書き投稿（dry-run） |
| `npm run wp:post -- --file drafts/article.md --publish --status draft` | 下書きを WP に投稿    |
| `npm test`                                                             | publisher テスト      |
| `npm run format:check`                                                 | Prettier              |

## 関連リポ

- [blog-affiliate-auto](https://github.com/felix-jp-studio/blog-affiliate-auto) — 計画・ロードマップ
- [article-auto-post](https://github.com/felix-jp-studio/article-auto-post) — Groq・投稿パターン参考
