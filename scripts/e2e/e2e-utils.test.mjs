import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  articlesPathPrefix,
  isArticleMarkdownPath,
  parseFrontmatter,
  slugFromArticlePath,
} from "./e2e-utils.mjs";

describe("e2e-utils article helpers", () => {
  it("extracts slug from article path", () => {
    assert.equal(
      slugFromArticlePath("site/src/content/articles/sim-20gb-osusume.md"),
      "sim-20gb-osusume",
    );
    assert.equal(
      slugFromArticlePath("site\\src\\content\\articles\\foo-bar.md"),
      "foo-bar",
    );
  });

  it("detects article markdown paths", () => {
    assert.equal(isArticleMarkdownPath(`${articlesPathPrefix}foo.md`), true);
    assert.equal(isArticleMarkdownPath(`${articlesPathPrefix}README.md`), false);
    assert.equal(isArticleMarkdownPath("scripts/e2e/foo.md"), false);
  });

  it("parses frontmatter fields", () => {
    const content = `---
title: Test
draft: "false"
---
body
`;
    const parsed = parseFrontmatter(content);
    assert.equal(parsed.fields.title, "Test");
    assert.equal(parsed.fields.draft, "false");
    assert.match(parsed.body, /^body/);
  });
});
