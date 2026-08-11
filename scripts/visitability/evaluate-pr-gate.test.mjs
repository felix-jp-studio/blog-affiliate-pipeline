import assert from "node:assert/strict";
import { describe, it } from "node:test";

const ALLOWED_PREFIXES = [
  "config/batch-cycle",
  "data/gsc-index-queue.json",
  "data/keywords.seed.csv",
  "state/generate-state.json",
  "site/src/content/articles/",
  "site/src/data/hub-article-mesh.ts",
];

function isAllowedFile(path) {
  return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isVisitabilityBranch(branch) {
  return /^feature\/visitability-cycle/i.test(branch);
}

describe("visitability pr gate helpers", () => {
  it("accepts visitability cycle branch names", () => {
    assert.equal(isVisitabilityBranch("feature/visitability-cycle32"), true);
    assert.equal(isVisitabilityBranch("feature/visitability-cycle-auto"), true);
    assert.equal(isVisitabilityBranch("feature/article-ux-improvements"), false);
  });

  it("allows typical cycle file paths", () => {
    assert.equal(isAllowedFile("site/src/content/articles/sim-mnp-tejun.md"), true);
    assert.equal(isAllowedFile("config/batch-cycle32-ratio.json"), true);
    assert.equal(isAllowedFile("scripts/gsc/inspect-batch.mjs"), false);
  });
});
