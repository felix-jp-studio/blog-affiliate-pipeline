import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "../..");
const scriptPath = join(repoRoot, "scripts/report-article-type-ratio.mjs");

describe("report-article-type-ratio", () => {
  it("emits JSON with expected article types", () => {
    const output = execFileSync("node", [scriptPath, "--json"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    const report = JSON.parse(output);
    assert.ok(report.total >= 40);
    assert.equal(typeof report.counts.comparison, "number");
    assert.equal(typeof report.ratios.howto, "number");
    assert.equal(report.target.howto, 25);
    assert.equal(report.weeklyQuota.crosssell, 1);
  });
});
