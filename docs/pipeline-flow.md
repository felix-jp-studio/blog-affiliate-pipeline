# パイプラインフロー

## Phase 0（現在）

```
drafts/*.md  →  publisher (wp:post)  →  WordPress
                    ↑
            affiliate-rules.json
```

## Phase 0.5（テスト記事）

```
config/test-batch.json
    → generator (template|groq) → site/src/content/articles/*.md
    → astro build → Vercel
```

## Phase 1（Month 2 目標）

```
keywords.seed.csv
    → keyword-cli → keywords.db
    → generator (outline) → drafts/outline-*.json
    → generator (article) → drafts/article-*.md
    → quality check
    → publisher → WordPress
```

## Phase 2

- scraper: 料金変更検知 → リライトキュー
- weekly-report: GSC / GA4 レポート

## npm scripts

`package.json` の scripts 一覧。スクリプトを追加・削除したらこの表も更新する
（`scripts/lib/npm-scripts-doc.test.mjs` が両者の一致を検証している）。

### 記事生成・公開

| script              | 内容                                              |
| ------------------- | ------------------------------------------------- |
| `generate:test`     | generator を auto モードで 1 本生成（動作確認用） |
| `generate:template` | generator を template モードで生成                |
| `generate:batch`    | バッチ設定ファイルからまとめて生成                |
| `publish:scheduled` | 予約投稿の記事を公開date到来分だけ公開            |
| `wp:ping`           | WordPress への疎通確認                            |
| `wp:post`           | WordPress へ記事を投稿                            |
| `paywall`           | site 側の有料記事ツール（Stripe 単品買い切り）    |
| `comments:moderate` | コメントのモデレーション                          |
| `docs:design-html`  | design 系 Markdown を HTML に変換                 |

### サイト運用・監査

| script                      | 内容                                            |
| --------------------------- | ----------------------------------------------- |
| `audit:orphans`             | どこからもリンクされていない記事を検出          |
| `audit:hub-mesh`            | ハブ ↔ 記事の相互リンク網羅率を監査             |
| `sync:hub-mesh`             | 記事側の情報からハブのメッシュ定義を更新        |
| `update:home-featured`      | トップのおすすめ記事を GSC 実績で再選定（月次） |
| `backfill:date-modified`    | frontmatter の dateModified を補完              |
| `backfill:internal-links`   | 記事本文に内部リンクを補完                      |
| `post-publish:onboard`      | 公開直後の記事をインデックスキュー等に登録      |
| `report:article-type-ratio` | 記事タイプ比率のレポート                        |
| `indexnow:ping`             | IndexNow に更新を通知                           |

### Google Search Console

| script                     | 内容                                    |
| -------------------------- | --------------------------------------- |
| `gsc:auth:login`           | GSC 認証セッションを取得                |
| `gsc:auth:login:legacy`    | 旧方式（Playwright セッション書き出し） |
| `gsc:verify-access`        | GSC API へのアクセス可否を確認          |
| `gsc:verify-ui`            | GSC の UI セッションを確認              |
| `gsc:inspect-batch`        | URL 検査をバッチ実行                    |
| `gsc:inspection-batch`     | 検査対象 URL バッチを出力               |
| `gsc:index-queue-status`   | インデックスキューの状況を表示          |
| `gsc:weekly-report`        | 週次の検索パフォーマンスレポート        |
| `gsc:weekly-log`           | 週次ログを docs/operations に生成       |
| `gsc:import-rewrite-queue` | GSC CSV からリライトキューを取り込み    |

### リライト・価格追従

| script                            | 内容                                 |
| --------------------------------- | ------------------------------------ |
| `rewrite:weekly`                  | リライトキューの先頭 1 件を処理      |
| `seed:rewrite-queue`              | GSC なしでリライトキューを初期投入   |
| `price-diff:rewrite-hook`         | 光回線の料金差分を検知しキューに追加 |
| `price-diff:rewrite-hook:dry-run` | 同上（書き込みなし）                 |
| `scraper:hikari`                  | 光回線の料金をスクレイプ             |
| `scraper:hikari:fixture`          | 同上（固定 fixture を使用）          |

### アフィリエイト

| script                      | 内容                                  |
| --------------------------- | ------------------------------------- |
| `affiliate:intake`          | ASP の URL を取り込み                 |
| `affiliate:intake:dry-run`  | 同上（書き込みなし）                  |
| `affiliate:migrate`         | 記事内のリンクを新しい計測 URL に移行 |
| `affiliate:migrate:dry-run` | 同上（書き込みなし）                  |
| `affiliate:health`          | リンクの死活チェック                  |
| `affiliate:health:dry-run`  | 同上（書き込みなし）                  |
| `affiliate:parse`           | ASP の貼り付けテキストを解析          |
| `affiliate:plan`            | 同期サイクルを計画                    |
| `affiliate:plan:dry-run`    | 同上（書き込みなし）                  |

### PDCA 自動化

| script                  | 内容                                     |
| ----------------------- | ---------------------------------------- |
| `refactor:metrics`      | Refactor PDCA のメトリクス収集（Check）  |
| `refactor:plan`         | 次サイクルを計画しブリーフを生成（Plan） |
| `refactor:plan:dry-run` | 同上（書き込みなし）                     |
| `ux:metrics`            | UX PDCA のメトリクス収集（Check）        |
| `ux:plan`               | 次サイクルを計画しブリーフを生成（Plan） |
| `visitability:metrics`  | Visitability のメトリクス収集            |
| `visitability:plan`     | 次サイクルを計画                         |
| `visitability:run`      | サイクルを実行                           |

### テスト・整形

| script                          | 内容                                                        |
| ------------------------------- | ----------------------------------------------------------- |
| `test`                          | 下の unit 系スイートをまとめて実行（CI の validate が実行） |
| `test:generator`                | generator の Python テスト                                  |
| `test:scraper`                  | scraper の Python テスト                                    |
| `test:affiliate`                | scripts/affiliate のテスト                                  |
| `test:comments`                 | site 側の unit テスト                                       |
| `test:gsc`                      | scripts/gsc のテスト                                        |
| `test:rewrite`                  | scripts/rewrite のテスト                                    |
| `test:lib`                      | scripts/lib のテスト                                        |
| `test:e2e:utils`                | scripts/e2e のテスト                                        |
| `test:refactor-pdca`            | scripts/refactor-pdca のテスト                              |
| `test:ux-pdca`                  | scripts/ux-pdca のテスト                                    |
| `test:visitability`             | scripts/visitability のテスト                               |
| `test:home-featured`            | scripts/home-featured のテスト                              |
| `test:e2e`                      | 記事検証 → site ビルド → 出力検証                           |
| `test:e2e:local`                | ローカル一括 E2E（template モード）                         |
| `test:e2e:articles`             | 記事 Markdown の検証                                        |
| `test:e2e:dist`                 | ビルド出力の検証                                            |
| `test:e2e:smoke`                | 本番サイトのスモークテスト                                  |
| `test:e2e:cwv`                  | Lighthouse CI で Core Web Vitals を計測                     |
| `test:e2e:indexnow`             | IndexNow キーファイルの検証                                 |
| `test:e2e:changed-slugs`        | PR 差分から対象 slug を解決                                 |
| `test:e2e:visual`               | Playwright のビジュアル回帰                                 |
| `test:e2e:visual:update`        | ビジュアルのベースライン更新                                |
| `test:e2e:visual:docker`        | CI と同じ Linux 環境で検証                                  |
| `test:e2e:visual:update:docker` | CI と同じ Linux 環境でベースライン更新                      |
| `test:e2e:all`                  | test:e2e と test:e2e:visual をまとめて実行                  |
| `format`                        | Prettier で整形                                             |
| `format:check`                  | Prettier の差分チェック                                     |
