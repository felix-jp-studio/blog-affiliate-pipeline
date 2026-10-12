import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";

/**
 * docs/pipeline-flow.md lists every npm script. A plain copy rots, so this
 * fails the build when package.json and the doc drift apart.
 */
const scripts = Object.keys(
  JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).scripts,
);
const doc = readFileSync(join(repoRoot, "docs/pipeline-flow.md"), "utf8");
const documented = new Set(
  [...doc.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map((match) => match[1]),
);

describe("npm scripts documentation", () => {
  it("documents every script in package.json", () => {
    const missing = scripts.filter((name) => !documented.has(name));
    assert.deepEqual(missing, [], `undocumented npm scripts: ${missing.join(", ")}`);
  });

  it("does not list scripts that no longer exist", () => {
    const stale = [...documented].filter((name) => !scripts.includes(name));
    assert.deepEqual(stale, [], `documented but missing from package.json: ${stale}`);
  });
});
