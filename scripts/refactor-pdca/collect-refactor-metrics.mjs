#!/usr/bin/env node
/**
 * Collect Refactor PDCA metrics (Check phase).
 */
import {
  PATHS,
  countFormatDrift,
  countOpenRefactorPrs,
  countTodoComments,
  loadBacklog,
  readJson,
  writeJson,
} from "./lib.mjs";

const args = process.argv.slice(2);
const updateState = args.includes("--update-state");
const asJson = args.includes("--json") || updateState;

function collectMetrics() {
  const tasks = loadBacklog();
  return {
    collectedAt: new Date().toISOString(),
    backlogPending: tasks.filter((t) => t.status === "pending").length,
    backlogTotal: tasks.length,
    formatDriftFiles: countFormatDrift(),
    todoCommentCount: countTodoComments(),
    openRefactorPrs: countOpenRefactorPrs(),
  };
}

function main() {
  const metrics = collectMetrics();
  if (updateState) {
    const state = readJson(PATHS.state, {
      cycleNumber: 1,
      consecutiveFailures: 0,
      paused: false,
      blockers: [],
    });
    state.metrics = metrics;
    state.lastRunAt = metrics.collectedAt;
    writeJson(PATHS.state, state);
  }
  if (asJson) {
    console.log(JSON.stringify(metrics, null, 2));
    return;
  }
  console.log(
    `Refactor metrics: drift=${metrics.formatDriftFiles} todos=${metrics.todoCommentCount} openPRs=${metrics.openRefactorPrs}`,
  );
}

main();
