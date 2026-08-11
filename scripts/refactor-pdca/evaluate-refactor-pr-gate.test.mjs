import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALLOW_SCOPE, DENY_SCOPE, MAX_DIFF_LINES, MAX_FILES } from "./lib.mjs";

function isRefactorBranch(branch) {
  return /^feature\/refactor-pdca/i.test(branch);
}

function isAllowed(path) {
  if (DENY_SCOPE.some((p) => path.startsWith(p))) return false;
  if (path.startsWith("scripts/refactor-pdca/")) return true;
  if (path.startsWith("config/refactor-")) return true;
  if (path.startsWith("data/refactor-cycle-brief.json")) return true;
  if (path.startsWith("docs/refactor-pdca-automation-design.html")) return true;
  if (path.startsWith("docs/operations/refactor-pdca-log.md")) return true;
  if (path.startsWith(".github/workflows/refactor-")) return true;
  return ALLOW_SCOPE.some((p) => path.startsWith(p));
}

describe("refactor pr gate helpers", () => {
  it("accepts refactor pdca branch names", () => {
    assert.equal(isRefactorBranch("feature/refactor-pdca-1-auto"), true);
    assert.equal(isRefactorBranch("feature/refactor-pdca-2-agent"), true);
    assert.equal(isRefactorBranch("feature/visitability-cycle32"), false);
  });

  it("allows scripts and denies article paths", () => {
    assert.equal(isAllowed("scripts/e2e/e2e-utils.mjs"), true);
    assert.equal(isAllowed("packages/publisher/index.js"), true);
    assert.equal(isAllowed("site/src/content/articles/foo.md"), false);
    assert.equal(isAllowed("site/src/components/Header.astro"), false);
  });

  it("enforces diff limits from lib constants", () => {
    assert.equal(MAX_DIFF_LINES, 300);
    assert.equal(MAX_FILES, 15);
  });
});
