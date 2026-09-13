import assert from "node:assert/strict";
import { test } from "node:test";
import { renderMarkdown } from "../src/lib/paywall/markdown.ts";

test("有料本文の Markdown を HTML にする", async () => {
  const html = await renderMarkdown(
    ["## 結論", "", "- 一つ目", "- 二つ目", "", "**太字**の段落。"].join("\n"),
  );

  assert.match(html, /<h2>結論<\/h2>/);
  assert.match(html, /<li>一つ目<\/li>/);
  assert.match(html, /<strong>太字<\/strong>/);
});

test("GFM のテーブルを描画できる", async () => {
  const html = await renderMarkdown(
    ["| 項目 | 金額 |", "| --- | --- |", "| 初期費用 | 3,300円 |"].join("\n"),
  );
  assert.match(html, /<table>/);
  assert.match(html, /3,300円/);
});

test("記事本文と同じ rehype プラグインを適用できる", async () => {
  const addId = () => (tree) => {
    for (const node of tree.children) {
      if (node.type === "element" && node.tagName === "h2") {
        node.properties = { ...node.properties, id: "premium-heading" };
      }
    }
  };

  const html = await renderMarkdown("## 料金の内訳", [], [addId]);
  assert.match(html, /<h2 id="premium-heading">/);
});
