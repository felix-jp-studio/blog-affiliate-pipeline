#!/usr/bin/env node
/**
 * Rewrite cycle act: one meta rewrite from rewrite-queue.csv.
 */
import { execFileSync } from "node:child_process";
import { PATHS, readJson } from "./lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const brief = readJson(PATHS.actBrief);

function main() {
  try {
    execFileSync("node", ["scripts/rewrite-weekly.mjs"], {
      cwd: repoRoot,
      stdio: "inherit",
    });
  } catch (error) {
    if (error.status === 0) return;
    throw error;
  }
  console.log(JSON.stringify({ actType: "rewrite_cycle", cycle: brief?.cycleNumber }));
}

main();
