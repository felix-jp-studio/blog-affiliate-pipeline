#!/usr/bin/env node
/**
 * Deterministic UX fixes (script execution path).
 *
 * Usage:
 *   node scripts/ux-pdca/run-ux-fixes.mjs
 *   node scripts/ux-pdca/run-ux-fixes.mjs --dry-run
 */
import { execFileSync } from "node:child_process";
import { PATHS, readJson } from "./lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

function main() {
  const brief = readJson(PATHS.brief);
  if (!brief) {
    console.error("data/ux-cycle-brief.json not found");
    process.exit(2);
  }

  const formatTargets = [
    "site/src/components",
    "site/src/styles",
    "site/src/pages",
    "site/src/layouts",
  ];

  if (dryRun) {
    console.log(JSON.stringify({ taskId: brief.taskId, formatTargets }, null, 2));
    return;
  }

  execFileSync("npx", ["prettier", "--write", ...formatTargets], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  execFileSync("npm", ["run", "format:check", "--prefix", "site"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  console.log(JSON.stringify({ taskId: brief.taskId, outcome: "script-fixes-applied" }));
}

main();
