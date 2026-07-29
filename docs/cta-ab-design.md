# CTA 配置 A/B デザイン

記事内アフィリエイト CTA（`affiliate-cta-block`）の配置を比較するための v1 設計。

## バリアント

| ID              | `CtaPlacement`      | 挙動                                                                     |
| --------------- | ------------------- | ------------------------------------------------------------------------ |
| A（デフォルト） | `after-table`       | 比較表（最初の `table-scroll` ラッパー）直後に CTA ブロックをまとめて配置 |
| B               | `before-conclusion` | 「まとめ」「結論」「FAQ」「よくある質問」見出し直前に CTA をまとめて配置 |

## 設定

- デフォルト: `site/src/data/cta-placement.ts` の `defaultCtaPlacement`
- 記事別 override: 同ファイルの `ctaPlacementBySlug`（slug → placement）
- Markdown コメント override: `<!-- cta-placement:before-conclusion -->`（生成器・リライト時に利用可）

## 実装

- `rehype-affiliate-cta` で段落リンクを CTA ブロック化
- `rehype-cta-placement` が後段でブロックを移動（`markdown-plugins.ts` 参照）

## 計測メモ（将来）

- GA4 カスタムイベントまたはクリック計測で variant 別 CTR を比較
- 初期サンプル: `sim-20gb-osusume`（B） vs 他 comparison 記事（A）
