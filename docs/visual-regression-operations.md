# Visual Regression E2E 運用ガイド

**対象リポジトリ**: `blog-affiliate-pipeline`（Astro 静的サイト / sim-hikari-guide.com、`site/` 配下）  
**関連設計**: [visual-regression-design.md](./visual-regression-design.md)、[playwright-visual-implementation-design.md](./playwright-visual-implementation-design.md)

> **注意**: 計画・ロードマップ管理リポ `blog-affiliate-auto` にはサイト本体は含まれません。Visual regression の実装・baseline・CI はすべて本リポジトリ（`blog-affiliate-pipeline`）で管理します。

---

## 1. 方式の概要

| レイヤ     | API                        | baseline | 検知対象                            |
| ---------- | -------------------------- | -------- | ----------------------------------- |
| **Visual** | `toHaveScreenshot()`       | `*.png`  | レイアウト・色・余白                |
| **Text**   | `toMatchSnapshot('*.txt')` | `*.txt`  | h1・見出し・CTA・フッター付近の文言 |

Percy / Chromatic 等の hosted サービスは **採用していません**（追加コスト 0、baseline を Git 管理）。

---

## 2. 対象ページ（7 URL）

設定の正本: `site/tests/visual/fixtures/pages.ts`（CI コメント用: `scripts/e2e/visual-pages.mjs`）

| ページ         | パス                         | 役割                  |
| -------------- | ---------------------------- | --------------------- |
| トップ         | `/`                          | 最新記事・リード      |
| SIM ハブ       | `/sim`                       | カテゴリ一覧・ASP CTA |
| 光回線ハブ     | `/hikari`                    | 同上                  |
| コストハブ     | `/cost`                      | crosssell カテゴリ    |
| 比較記事       | `/articles/sim-20gb-osusume` | 記事テンプレート      |
| crosssell 記事 | `/articles/au-denki-setwari` | セット割記事          |
| お問い合わせ   | `/contact`                   | フォーム UX           |

---

## 3. ファイル構成

```
site/
├── playwright.config.ts              # webServer, snapshotPathTemplate, Chromium 1280×720
├── tests/visual/
│   ├── fixtures/pages.ts             # 対象 URL・locator・snapshot 名
│   ├── helpers/
│   │   ├── stabilize-page.ts         # フォント待ち・animation 無効・mask
│   │   └── normalize-text.ts         # 空白正規化
│   ├── *.visual.spec.ts              # ページ別 spec（7 本）
│   └── *-snapshots/                  # PNG + txt baseline（Git 管理）
scripts/e2e/
├── visual-pages.mjs                  # PR コメント用ページ定義
├── collect-visual-diffs.mjs          # diff PNG 収集
├── post-visual-pr-comment.mjs        # PR コメント Markdown 生成
└── update-visual-baselines-docker.sh # Linux baseline 更新・検証
.github/workflows/
├── ci.yml                            # format / test / build（visual 不含）
└── pull-request.yml                  # PR 時 visual regression + コメント投稿
```

---

## 4. 実行コマンド

リポジトリルートから:

```bash
# テスト実行（ローカル macOS では PNG が OS 差で FAIL しうる）
npm run test:e2e:visual

# baseline 更新（原則 Docker 経由 — 下記 §5）
npm run test:e2e:visual:update

# 機能 E2E + visual 一括
npm run test:e2e:all

# Linux（CI 同等）で baseline 更新
bash scripts/e2e/update-visual-baselines-docker.sh update

# Linux で検証のみ
bash scripts/e2e/update-visual-baselines-docker.sh verify
```

PR コメント Markdown のローカル確認:

```bash
node scripts/e2e/post-visual-pr-comment.mjs --dry-run
# レポートがある場合
VISUAL_REPORT_PATH=site/test-results/visual-report.json \
  node scripts/e2e/post-visual-pr-comment.mjs --dry-run
```

---

## 5. baseline 更新ルール

### 5.1 OS 統一（必須）

| 環境                                                      | baseline 更新 | 理由                            |
| --------------------------------------------------------- | ------------- | ------------------------------- |
| **GitHub Actions（ubuntu-latest）**                       | ✅ 正         | CI と同一                       |
| **Docker `mcr.microsoft.com/playwright:<version>-noble`** | ✅ 推奨       | ローカルでも CI 同等            |
| **macOS / Windows ネイティブ**                            | ❌ 原則禁止   | フォントレンダリング差で誤 FAIL |

CI 上での `--update-snapshots` 自動実行は **禁止**（意図した UI 変更のみ人間がレビューして更新）。

**例外**: `scheduled-articles.yml` が記事 PR 向けに Hub 系 snapshot を Ubuntu 上で自動更新する場合あり。

Docker 実行時は `site/node_modules` をコンテナ専用ボリュームにマウントし、ホスト（macOS）の native モジュール（`sharp` 等）を上書きしない。

### 5.2 更新フロー

1. UI / 文言を意図的に変更する PR を作成
2. `pull-request.yml` が FAIL → diff PNG / txt を確認
3. 意図どおりなら Docker で baseline 更新:

   ```bash
   bash scripts/e2e/update-visual-baselines-docker.sh update
   git add site/tests/visual/
   git commit -m "test(visual): update baselines for <変更内容>"
   ```

4. 再 push → CI green を確認してマージ

---

## 6. CI ワークフロー（`pull-request.yml`）

**トリガ**: `pull_request` → `main`、`site/**` 等の変更時

**手順**:

1. `npm ci`（ルート + `site/`）
2. `npx playwright install --with-deps chromium`
3. `npm run test:e2e:visual`（build + preview を webServer が自動起動）
4. 失敗時: diff PNG を `.github/pr-visual-diffs/` に収集 → PR ブランチへ push
5. `post-visual-pr-comment.mjs` が Markdown 表を PR コメント投稿（`<!-- playwright-visual-report -->` で更新）
6. artifact `playwright-visual-diff` を 14 日保持

汎用 CI（`ci.yml`）は変更せず、visual は別 workflow に分離。

---

## 7. PR コメントの表示例

```markdown
<!-- playwright-visual-report -->

## Visual regression: 1 件 FAIL

| ページ     | Visual | Text | Diff                                                                                                       |
| ---------- | ------ | ---- | ---------------------------------------------------------------------------------------------------------- |
| `/sim`     | ❌     | ✅   | ![sim-hub diff](https://raw.githubusercontent.com/owner/repo/sha/.github/pr-visual-diffs/sim-hub-diff.png) |
| `/contact` | ✅     | ✅   | 一致                                                                                                       |

_Playwright hybrid visual regression (`pull-request.yml`)_
```

- **PASS**: Diff 列は「一致」
- **Visual FAIL**: diff 率・snapshot 名・PNG 埋め込み（または artifact リンク）
- **Text FAIL**: snapshot 名 + artifact リンク

---

## 8. flaky 対策（実装済み）

`stabilize-page.ts` で以下を実施:

- Web フォント読み込み待ち（`document.fonts.ready`）
- CSS animation / transition 無効化
- 日付・ASP リンク・記事件数・フォーム・eyecatch を mask

`normalize-text.ts` で連続空白を正規化し、text snapshot のノイズを低減。

`maxDiffPixelRatio: 0.01`（控えめ。OS 差は baseline 生成環境の統一で吸収）。

---

## 9. 既知の制限

| 制限         | 説明                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| OS 差        | macOS での `test:e2e:visual` は PNG FAIL が正常。Docker または CI で確認          |
| fork PR      | `GITHUB_TOKEN` 権限不足で diff 画像 push が失敗 → artifact リンクにフォールバック |
| 画像サイズ   | PR コメント内 PNG は大きいと読み込みが遅い                                        |
| 記事追加     | Hub の先頭 3 件タイトルのみ text snapshot。件数変動は mask                        |
| 全ページ網羅 | 初回 7 ページ固定。拡張は段階的                                                   |

---

## 10. 意図した変更時の対応

Visual / Text のいずれかが FAIL した場合:

1. PR コメントと artifact で diff を確認
2. **意図した変更** → §5 の手順で baseline 更新を **同一 PR に含める**（マージ前必須）
3. **意図しない変更** → UI / 文言を修正し、baseline 更新は不要

baseline 更新なしでマージすると、以降の PR でも CI が FAIL し続けます。
