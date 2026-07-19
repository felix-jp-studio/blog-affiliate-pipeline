# ビジュアル回帰 / E2E テスト設計（スタック横断比較）

**対象**: `blog-affiliate-pipeline`（格安 SIM × 光回線アフィリエイト / sim-hikari-guide.com）  
**関連**: [e2e-publish-check-design.md](./e2e-publish-check-design.md)（P0/P1 機能 E2E）  
**ステータス**: 設計提案（未実装）  
**作成日**: 2026-07-19

---

## 概要

本ドキュメントは、**ビジュアル回帰テスト**（スクリーンショット比較）と **E2E ブラウザテスト**の方式選定を、現行スタック（Astro 静的サイト）に加え **React SPA** および **Next.js App Router** でも適用できるよう整理したものです。

[e2e-publish-check-design.md](./e2e-publish-check-design.md) が P0/P1 の機能検証（MD / dist / 本番 smoke）を扱うのに対し、本設計は **P2 以降の UI 回帰検知** と、将来のスタック移行時の判断材料を提供します。

---

## 1. スタック比較表

| 観点                       | Astro（現行・sim-hikari-guide）                                                        | React SPA（CRA / Vite）                                                                                 | Next.js App Router                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **レンダリング**           | **SSG 中心**（`astro build` → 静的 HTML）。島アーキテクチャで部分的 CSR 可             | **CSR のみ**（初回は空 HTML + JS バンドル。`index.html` シェル）                                        | **SSG / SSR / CSR / ISR** をルート単位で混在。Server Components + Client Components                                |
| **Playwright の起動対象**  | **`astro preview`** または `npx serve site/dist`（本番同等）。`astro dev` は非推奨     | **`vite preview`** / `serve -s build`（production build 必須）。`vite dev` / `npm start` は非推奨       | **`next build && next start`**（本番モード）。または **Vercel Preview URL**（PR ごと）。`next dev` は非推奨        |
| **テストアプローチ**       | ビルド済み `dist/` を静的配信 → `page.goto('/articles/{slug}')` → 即 DOM 安定          | `page.goto` 後 **`waitForLoadState('networkidle')`** または特定セレクタ待ち。ルーティングは history API | ルート種別に応じた待ち: SSG は即安定、SSR は **`waitForSelector`** / **`toPass`**。Preview では CDN 反映待ち retry |
| **スナップショット安定性** | **高** — hydration なし（または最小）。日付・乱数を frontmatter 固定化すればほぼ決定的 | **中** — 初回 paint → hydration → 非同期 fetch の順序差。Web フォント FOUT/FOIT                         | **中〜低** — SSR/CSR 境界、**hydration mismatch**、`next/image` の lazy blur、`next/font` のサブセット読込         |
| **CI 複雑度**              | **低** — `npm run build` → serve → Playwright 1 job で完結                             | **中** — build + preview 起動 + 待ち戦略のチューニング。client routing 用 baseURL 設定                  | **高** — build 時間・env（`NEXT_PUBLIC_*`）・Preview Deploy 連携。Server/Edge runtime 差の考慮                     |
| **sim-hikari-guide 適合**  | **最適**（現構成と一致）                                                               | 移行コスト大（SEO / メタ / sitemap を自前実装）                                                         | 移行コスト中〜大（メリットは動的機能・A/B 等が必要な場合）                                                         |

---

## 2. 方式 × スタック適合マトリクス

凡例: ★★★ 第一推奨 / ★★☆ 条件付き推奨 / ★☆☆ 非推奨または最後の手段 / — 用途外

| 方式                                                              | Astro（現行） | React SPA | Next.js App Router | 備考                                                                                                       |
| ----------------------------------------------------------------- | ------------- | --------- | ------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Playwright `toHaveScreenshot()`**                               | ★★☆           | ★★☆       | ★★☆                | いずれも **production build 配信** が前提。閾値 `maxDiffPixelRatio` と `mask` で広告枠・日付を除外         |
| **Percy**                                                         | ★★☆           | ★★☆       | ★★★                | クラウド diff + ブランチベースレビュー。Next/Vercel 連携事例が多い                                         |
| **Chromatic**                                                     | ★☆☆           | ★★★       | ★★★                | **Storybook + コンポーネント単位** が主戦場。React/Next UI ライブラリ向け。Astro は Storybook 構築コスト増 |
| **HTML / text snapshot**（Playwright `toMatchSnapshot` / Vitest） | ★★★           | ★☆☆       | ★★☆                | Astro の **dist HTML** は決定的で最適。CSR/SSR では実行時 HTML が不安定になりやすい                        |
| **curl + meta パーサ**（現 P1 smoke）                             | ★★★           | ★☆☆       | ★★☆                | 視覚回帰ではないが、3 スタック共通の **機能 smoke** として有効                                             |

### スタック別の第一推奨組み合わせ

| スタック      | P2 最小構成                                                   | P3 拡張                                                                                                  |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Astro**     | `validate-dist.mjs`（HTML/text）+ 任意 Playwright 数ページ    | Percy または Playwright visual 全テンプレート                                                            |
| **React SPA** | Playwright E2E（production preview）+ 主要導線のみ screenshot | Chromatic（コンポーネント）+ Percy（ページ）                                                             |
| **Next.js**   | Playwright against **`next start`** または **Vercel Preview** | Chromatic + Percy。App Router では **Server Component ページは E2E、Client 部品は Storybook** と役割分担 |

---

## 3. Next.js 特有の注意

### 3.1 SSR hydration mismatch

| 原因                                                                   | 症状                                                 | 対策                                                       |
| ---------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `Date.now()` / `Math.random()` を render 内で使用                      | コンソールに hydration error、スクリーンショット差分 | 値を props / server で固定、または Client Component に隔離 |
| ブラウザ専用 API（`window`, `localStorage`）を Server Component で参照 | サーバー HTML とクライアント不一致                   | `'use client'` + `useEffect` でクライアントのみ描画        |
| 条件付き class（UA 判定等）                                            | レイアウトシフト                                     | サーバー/クライアント同一 markup を保証                    |

Playwright では **`page.waitForFunction(() => !document.querySelector('[data-nextjs-toast]'))`** 等でエラー検知を追加すると早期発見できる。

### 3.2 `next/image` / `next/font`

| 機能             | スナップショットへの影響                             | テスト設定                                                                                                 |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **`next/image`** | lazy load、placeholder blur、srcset による段階的表示 | `images.unoptimized: true`（テスト config）または `await expect(locator).toBeVisible()` 後に screenshot    |
| **`next/font`**  | サブセット読込タイミングで FOIT/FOUT                 | `--font-display: optional` 検討、または `@font-face` モック / システムフォント fallback を test env で固定 |

### 3.3 Vercel Preview URL を visual test ターゲットにする

```
PR open → Vercel Preview deploy → PREVIEW_URL を GitHub Actions output
  → Playwright baseURL=${PREVIEW_URL} → toHaveScreenshot
```

| メリット                                        | デメリット                                          |
| ----------------------------------------------- | --------------------------------------------------- |
| 本番と同一 CDN / Edge / env に近い              | Preview ごとに URL 変動 → baseline 更新フロー要設計 |
| `next start` ローカル差異（画像最適化等）を回避 | 初回 deploy 完了待ち + flaky retry が必要           |

`VERCEL_URL` または Deploy Hook + `repository_dispatch` で smoke/visual workflow を起動するパターンが一般的。

### 3.4 `@playwright/test` + Next.js 公式パターン

Next.js ドキュメント推奨の要点:

1. **`webServer` 設定** — `next build && next start -p 3000` を Playwright config に記述
2. **`baseURL: 'http://127.0.0.1:3000'`** — `page.goto('/articles/...')` を相対パス化
3. **テスト専用 env** — `.env.test` で `NEXT_PUBLIC_*` を固定
4. **並列 CI** — `workers: 1` で flaky 低減（visual 比較時）

```typescript
// playwright.config.ts（Next.js 向け例）
export default defineConfig({
  webServer: {
    command: "npm run build && npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: "http://127.0.0.1:3000" },
});
```

---

## 4. React（CRA / Vite SPA）特有の注意

### 4.1 CSR only — network idle 待ち

| フェーズ        | DOM 状態                 | 推奨待ち                                                         |
| --------------- | ------------------------ | ---------------------------------------------------------------- |
| 初回            | 空または loading spinner | `await page.goto(url, { waitUntil: 'domcontentloaded' })`        |
| JS 実行後       | React root mount         | `await page.locator('[data-testid="app-ready"]').waitFor()`      |
| データ fetch 後 | 本文表示                 | **`waitForLoadState('networkidle')`** または API mock で決定的化 |

`networkidle` は SPA では **WebSocket / analytics 常時接続** でタイムアウトしやすい。長期運用では **mock Service Worker（MSW）** または **fixture JSON** で API を固定する方が安定。

### 4.2 ルーティング（react-router）

| 課題                                                                      | 対策                                                                         |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `BrowserRouter` — deep link は server fallback 要（`historyApiFallback`） | preview server（Vite `preview` / `serve -s`）で `/articles/*` → `index.html` |
| 直接 URL アクセス                                                         | Playwright `baseURL` + パス。静的ホスティングでは **全ルート rewrite** 必須  |
| ナビゲーション後の screenshot                                             | `page.click` → **`await page.waitForURL('**/articles/**')`** → screenshot    |

SEO 観点では sim-hikari-guide のような **記事サイトに CRA は非推奨**（メタ / OGP / sitemap を JS 依存にしないため）。

---

## 5. sim-hikari-guide: Astro 維持 vs Next.js 移行時の E2E 戦略差

**Astro 維持（現行）**では、記事 Markdown → 静的 HTML 生成 → `dist/` 検証という **決定的パイプライン** が主軸です。視覚回帰は P2 オプションとして、トップ・記事テンプレート・比較表コンポーネント数ページに Playwright `toHaveScreenshot` を限定適用すれば足ります。hydration がほぼないため baseline 更新頻度は低く、CI は `build → astro preview → Playwright` の単一 job で済みます。**Next.js 移行**すると、同じ記事 URL でも Server/Client 境界・`next/image`・Preview URL 単位の baseline 管理が必要になり、機能 E2E（meta / affiliate / sitemap）は [e2e-publish-check-design.md](./e2e-publish-check-design.md) の Node smoke を維持しつつ、visual は **Vercel Preview 向け Playwright** または **Chromatic（記事 UI コンポーネント）** へ比重を移すのが現実的です。移行コストに見合うのは、パーソナライズ・A/B・認証付きダッシュボード等、静的生成では賄えない要件が発生した場合に限られます。

| 観点              | Astro 維持                                                                | Next.js 移行後                                       |
| ----------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| **主 E2E 手段**   | Node: `validate-articles` / `validate-dist` / `smoke-production`（P0/P1） | 同 smoke + Next 固有 hydration / routing チェック    |
| **視覚回帰**      | Playwright × 静的 preview（数ページ）                                     | Playwright × Vercel Preview **または** Chromatic     |
| **baseline 管理** | リポジトリ内 screenshot または Percy 1 project                            | Preview URL 変動 → Percy/Chromatic クラウド推奨      |
| **CI 時間**       | 短い（Astro build ≒ 数十秒）                                              | 長い（Next build + optional Preview deploy wait）    |
| **flaky 要因**    | ほぼなし（日付・広告枠のみ mask）                                         | hydration、font、image lazy、Preview CDN             |
| **推奨優先度**    | HTML/text snapshot ★★★ / Playwright visual ★★☆                            | Playwright + Percy/Chromatic ★★★ / HTML snapshot ★★☆ |

---

## 6. sim-hikari-guide 向け推奨ロードマップ（スタック横断）

現行 Astro を前提とした段階導入。Next 移行時は §5 の表に従い Preview ベースへ切替。

| 優先度    | 項目                          | 方式                                      | スタック                    |
| --------- | ----------------------------- | ----------------------------------------- | --------------------------- |
| **P0/P1** | MD / dist / 本番 smoke        | Node + curl（既設計）                     | Astro ★★★                   |
| **P2**    | 記事テンプレート visual smoke | Playwright `toHaveScreenshot`（3〜5 URL） | Astro ★★☆ / Next ★★☆        |
| **P2**    | OG・構造化データ              | HTML snapshot（`validate-dist` 拡張）     | 全スタック ★★★              |
| **P3**    | コンポーネント UI 回帰        | Chromatic + Storybook                     | Next / React ★★★、Astro ★☆☆ |
| **P3**    | PR ごと visual diff           | Percy + Vercel Preview                    | Next ★★★、Astro ★★☆         |

---

## 7. Playwright 共通設定（スタック別）

| 設定                  | Astro                                                                              | React SPA                                    | Next.js                                       |
| --------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------- |
| **webServer command** | `npm run build && npm run preview`                                                 | `npm run build && npm run preview`           | `npm run build && npm run start`              |
| **baseURL**           | `http://127.0.0.1:4321`（Astro preview 既定）                                      | `http://127.0.0.1:4173`（Vite preview 既定） | `http://127.0.0.1:3000` または `$PREVIEW_URL` |
| **font 安定化**       | `await page.addStyleTag({ content: '* { font-family: sans-serif !important; }' })` | 同左                                         | 同左 + `next/font` test env                   |
| **動的要素 mask**     | 日付、A8/VC バナー                                                                 | analytics バナー                             | 同上 + Vercel Toolbar                         |
| **CI workers**        | 2（並列可）                                                                        | 1（networkidle 安定性）                      | 1（visual 時）                                |

---

## 参照

- [e2e-publish-check-design.md](./e2e-publish-check-design.md) — 機能 E2E（P0/P1）
- [article-ui-v2-design.md](./article-ui-v2-design.md) — 記事 UI コンポーネント
- [vercel-deploy.md](./vercel-deploy.md) — Preview / 本番デプロイ
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)
- [Next.js Playwright guide](https://nextjs.org/docs/app/guides/testing/playwright)
- [Chromatic for Next.js](https://www.chromatic.com/docs/nextjs)

---

## 承認

実装に進む場合は、以下の文言で承認してください。

> **I agree with the design. Please start implementation.**
