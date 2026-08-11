# docs/

`blog-affiliate-pipeline` の設計・運用ドキュメント置き場。

UI/UX や技術設計の提案は Markdown として本ディレクトリに保存し、`*-design.md` から HTML 版（`*-design.html`）を生成する。

```bash
npm run docs:design-html   # docs/*-design.md → *.html
```

- [ASP URL レジストリ](./asp-urls.md) — トラッキング URL・管理画面 URL の更新手順
- [IndexNow 連携](./indexnow.md) — 記事マージ後の Bing/Yandex 通知
- [Visual Regression 運用](./visual-regression-operations.md) — Playwright hybrid E2E・baseline 更新・PR コメント

## 設計書（HTML）

| 設計書                 | Markdown                                                                                   | HTML                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 記事自動生成           | [article-generation-design.md](./article-generation-design.md)                             | [HTML](./article-generation-design.html)               |
| Article UI v2          | [article-ui-v2-design.md](./article-ui-v2-design.md)                                       | [HTML](./article-ui-v2-design.html)                    |
| CTA A/B                | [cta-ab-design.md](./cta-ab-design.md)                                                     | [HTML](./cta-ab-design.html)                           |
| E2E 公開チェック       | [e2e-publish-check-design.md](./e2e-publish-check-design.md)                               | [HTML](./e2e-publish-check-design.html)                |
| 光回線料金スクレイパー | [hikari-price-scraper-design.md](./hikari-price-scraper-design.md)                         | [HTML](./hikari-price-scraper-design.html)             |
| Playwright Visual      | [playwright-visual-implementation-design.md](./playwright-visual-implementation-design.md) | [HTML](./playwright-visual-implementation-design.html) |
| 日曜クロスセル         | [sunday-crosssell-design.md](./sunday-crosssell-design.md)                                 | [HTML](./sunday-crosssell-design.html)                 |
| Visual Regression      | [visual-regression-design.md](./visual-regression-design.md)                               | [HTML](./visual-regression-design.html)                |
| Visitability PDCA      | —                                                                                          | [HTML](./visitability-pdca-automation-design.html)     |
| UX PDCA                | —                                                                                          | [HTML](./ux-pdca-automation-design.html)               |

設計書 PR は自動マージ対象（`docs/` のみの変更、または `design-doc` ラベル付き PR）。
