# blog-affiliate-pipeline

格安 SIM × 光回線 × お困り系アフィリエイトの記事生成・WordPress 投稿パイプライン。

## 設計書

[blog-affiliate-auto/docs/plans/blog-affiliate-pipeline-design.md](https://github.com/felix-jp-studio/blog-affiliate-auto/blob/main/docs/plans/blog-affiliate-pipeline-design.md)

## Phase 0（現在）

- `packages/publisher` — WordPress REST 投稿（`wp:ping` / `wp:post`）
- `config/` — プロンプト・アフィリエイトルール・品質閾値
- `data/keywords.seed.csv` — KW サンプル

## セットアップ

```bash
npm install
cp .env.example .env
# .env に WP_URL / WP_USER / WP_APP_PASSWORD を設定
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
