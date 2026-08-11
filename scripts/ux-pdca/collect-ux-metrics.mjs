#!/usr/bin/env node
/**
 * Collect UX PDCA metrics for Check phase.
 *
 * Usage:
 *   node scripts/ux-pdca/collect-ux-metrics.mjs
 *   node scripts/ux-pdca/collect-ux-metrics.mjs --json --update-state
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import {
  PATHS,
  loadBacklog,
  parseCwvBaseline,
  cwvRegressionFromBaseline,
  readJson,
  writeJson,
} from "./lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const updateState = args.includes("--update-state");

function countOpenUxPrs() {
  if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) return 0;
  try {
    const output = execFileSync(
      "gh",
      ["pr", "list", "--state", "open", "--label", "ux-pdca-auto", "--json", "number"],
      { cwd: repoRoot, encoding: "utf8" },
    );
    return JSON.parse(output).length;
  } catch {
    return 0;
  }
}

function visualTestStatus() {
  try {
    execFileSync("npm", ["run", "test:e2e:visual", "--prefix", "site"], {
      cwd: repoRoot,
      stdio: "pipe",
    });
    return { status: "pass", failed: 0 };
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    const failed = (output.match(/✘/g) ?? []).length || 1;
    return { status: "fail", failed };
  }
}

function collectMetrics() {
  const tasks = loadBacklog();
  const pending = tasks.filter((t) => t.status === "pending").length;
  const cwvContent = existsSync(PATHS.cwvBaseline)
    ? readFileSync(PATHS.cwvBaseline, "utf8")
    : "";
  const cwvRows = parseCwvBaseline(cwvContent);
  const cwv = cwvRegressionFromBaseline(cwvRows);

  let visual = { status: "skipped", failed: 0 };
  if (args.includes("--with-visual")) {
    visual = visualTestStatus();
  }

  return {
    collectedAt: new Date().toISOString(),
    backlogPending: pending,
    backlogTotal: tasks.length,
    openUxPrs: countOpenUxPrs(),
    cwvRegression: cwv.regression,
    cwvRegressionReason: cwv.reason,
    cwvLatest: cwvRows.at(-1) ?? null,
    visualTestStatus: visual.status,
    visualTestsFailed: visual.failed,
  };
}

function main() {
  const metrics = collectMetrics();

  if (updateState) {
    const state = readJson(PATHS.state, {
      cycleNumber: 1,
      consecutiveFailures: 0,
      blockers: [],
      paused: false,
    });
    state.metrics = metrics;
    state.lastRunAt = metrics.collectedAt;
    writeJson(PATHS.state, state);
  }

  if (asJson || updateState) {
    console.log(JSON.stringify(metrics, null, 2));
    return;
  }

  console.log(`UX metrics (${metrics.collectedAt})`);
  console.log(`Backlog pending: ${metrics.backlogPending}/${metrics.backlogTotal}`);
  console.log(`Open UX PRs: ${metrics.openUxPrs}`);
  console.log(
    `CWV regression: ${metrics.cwvRegression}${metrics.cwvRegressionReason ? ` (${metrics.cwvRegressionReason})` : ""}`,
  );
  console.log(`Visual tests: ${metrics.visualTestStatus}`);
}

main();
