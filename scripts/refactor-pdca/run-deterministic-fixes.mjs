#!/usr/bin/env node
/**
 * Deterministic refactor fixes (Prettier on scripts/packages).
 */
import { execFileSync } from "node:child_process";
import { PATHS, readJson } from "./lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

function main() {
  const brief = readJson(PATHS.brief);
  execFileSync("npx", ["prettier", "--write", "scripts/", "packages/"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  execFileSync("npm", ["run", "format:check"], { cwd: repoRoot, stdio: "inherit" });
  console.log(JSON.stringify({ taskId: brief?.taskId, outcome: "prettier-applied" }));
}

main();
