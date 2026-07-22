# generator

KW → 構成 JSON → Markdown 本文 → **同一カテゴリ内部リンク（2本）** → Astro 公開用ファイル。

設計: [`docs/article-generation-design.md`](../../docs/article-generation-design.md)

## 使い方

```bash
# リポジトリルートで実行
npm run generate:test      # GROQ_API_KEY があれば Groq、なければ template
npm run generate:template  # オフライン・CI 用テンプレート生成
```

## 出力

- `site/src/content/articles/YYYY-MM-DD-slug.md`
- 状態: `state/generate-state.json`

## テスト

```bash
cd packages/generator
PYTHONPATH=. python3 -m unittest discover -s tests -q
```
