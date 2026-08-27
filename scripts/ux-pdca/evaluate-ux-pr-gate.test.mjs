import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isAllowedFile,
  isPrVisualDiffArtifact,
  isUxPrRepairable,
  planUxPrRepairs,
} from "./ux-pr-gate-lib.mjs";

describe("ux pr gate lib", () => {
  it("allows component changes", () => {
    assert.equal(isAllowedFile("site/src/components/ArticleHero.astro"), true);
  });

  it("allows pr-visual-diffs gitkeep only", () => {
    assert.equal(isAllowedFile(".github/pr-visual-diffs/.gitkeep"), true);
    assert.equal(isAllowedFile(".github/pr-visual-diffs/sim-hub-actual.png"), false);
  });

  it("blocks article markdown", () => {
    assert.equal(isAllowedFile("site/src/content/articles/foo.md"), false);
  });

  it("detects pr visual diff artifacts", () => {
    assert.equal(isPrVisualDiffArtifact(".github/pr-visual-diffs/foo.png"), true);
    assert.equal(isPrVisualDiffArtifact(".github/pr-visual-diffs/.gitkeep"), false);
  });

  it("plans removal of pr-visual-diffs when only disallowed paths", () => {
    const files = [
      "site/src/components/HubComparisonTable.astro",
      ".github/pr-visual-diffs/sim-hub-diff.png",
    ];
    const failResult = { failedChecks: ["file-allowlist"] };
    assert.deepEqual(planUxPrRepairs(failResult, files), ["remove-pr-visual-diffs"]);
    assert.equal(isUxPrRepairable(failResult, files), true);
  });

  it("plans visual baseline update when playwright-visual fails", () => {
    const failResult = { failedChecks: ["playwright-visual"] };
    const files = ["site/src/components/Foo.astro"];
    assert.deepEqual(planUxPrRepairs(failResult, files), ["update-visual-baselines"]);
  });

  it("does not repair forbidden article paths", () => {
    const failResult = { failedChecks: ["forbidden-paths"] };
    assert.equal(isUxPrRepairable(failResult, ["site/src/content/articles/x.md"]), false);
  });
});
