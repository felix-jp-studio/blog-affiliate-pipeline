import assert from "node:assert/strict";
import { describe, it } from "node:test";

const FORBIDDEN = ["site/src/content/articles/"];
const ALLOWED = ["site/src/components/", "site/src/styles/"];

function isAllowed(path) {
  if (FORBIDDEN.some((p) => path.startsWith(p))) return false;
  return ALLOWED.some((p) => path.startsWith(p));
}

describe("ux pr gate helpers", () => {
  it("allows component changes", () => {
    assert.equal(isAllowed("site/src/components/ArticleHero.astro"), true);
  });

  it("blocks article markdown", () => {
    assert.equal(isAllowed("site/src/content/articles/foo.md"), false);
  });
});
