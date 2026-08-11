#!/usr/bin/env node
/**
 * Index push act: GSC inspect batch or ops note when secrets unavailable.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS, readJson } from "./lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const brief = readJson(PATHS.actBrief);
const batchSize = brief?.params?.batchSize ?? 10;

function writeOpsNote(output) {
  const date = new Date().toISOString().slice(0, 10);
  const notePath = join(repoRoot, `docs/operations/gsc-inspect-run-${date}.md`);
  mkdirSync(join(repoRoot, "docs/operations"), { recursive: true });
  const header = existsSync(notePath) ? "" : `# GSC inspect batch ${date}\n\n`;
  writeFileSync(notePath, `${header}${output}\n`, { flag: "a" });
  console.log(`Wrote ${notePath}`);
}

function main() {
  const hasGsc =
    process.env.GSC_SERVICE_ACCOUNT_JSON ||
    process.env.GSC_OAUTH_CLIENT_ID ||
    process.env.GSC_PLAYWRIGHT_STORAGE_STATE;

  if (hasGsc) {
    try {
      execFileSync(
        "node",
        [
          "scripts/gsc/inspect-batch.mjs",
          "--week-first",
          `--limit=${batchSize}`,
          "--write-note",
          "--commit",
        ],
        { cwd: repoRoot, stdio: "inherit" },
      );
      return;
    } catch (error) {
      console.warn("GSC inspect-batch failed, falling back to print batch");
    }
  }

  const output = execFileSync(
    "node",
    [
      "scripts/print-gsc-inspection-batch.mjs",
      "--week-first",
      `--limit=${batchSize}`,
      "--format=md",
    ],
    { cwd: repoRoot, encoding: "utf8" },
  );
  writeOpsNote(output);
  console.log(output);
}

main();
