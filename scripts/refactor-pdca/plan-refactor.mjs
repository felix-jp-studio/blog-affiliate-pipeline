#!/usr/bin/env node
/**
 * Plan next Refactor PDCA cycle.
 */
import {
  PATHS,
  buildAgentPrompt,
  loadBacklog,
  readJson,
  saveBacklog,
  selectTask,
  writeJson,
} from "./lib.mjs";

const dryRun = process.argv.includes("--dry-run");

function planRefactor() {
  const state = readJson(PATHS.state, {
    cycleNumber: 1,
    consecutiveFailures: 0,
    paused: false,
    blockers: [],
  });

  if (state.paused) return { action: "skip", reason: "paused", state };
  if (state.consecutiveFailures >= 3) {
    state.paused = true;
    return { action: "pause", reason: "consecutiveFailures >= 3", state };
  }

  const metrics = state.metrics ?? {
    formatDriftFiles: 0,
    openRefactorPrs: 0,
    backlogPending: 0,
  };
  if (metrics.openRefactorPrs > 0) {
    return {
      action: "skip",
      reason: `open PRs: ${metrics.openRefactorPrs}`,
      state,
      metrics,
    };
  }

  const { task, reason } = selectTask(metrics);
  if (!task) return { action: "escalate", reason, state, metrics };

  const brief = {
    cycleNumber: state.cycleNumber,
    taskId: task.id,
    title: task.title,
    execution: task.execution ?? "agent",
    reason,
    targetPaths: task.targetPaths ?? [],
    acceptance: task.acceptance ?? [],
    agentPrompt:
      task.execution === "agent" ? buildAgentPrompt(task, state.cycleNumber) : null,
    createdAt: new Date().toISOString(),
  };

  state.lastOutcome = "planned";
  state.lastTaskId = task.id;
  return { action: "plan", brief, task, state, metrics };
}

function main() {
  const result = planRefactor();
  console.log(JSON.stringify({ action: result.action, reason: result.reason ?? null }));

  if (result.action === "skip" || result.action === "pause") {
    if (!dryRun) writeJson(PATHS.state, result.state);
    process.exit(result.action === "pause" ? 2 : 0);
  }
  if (result.action === "escalate") {
    if (!dryRun)
      writeJson(PATHS.state, { ...result.state, lastOutcome: "plan-escalate" });
    process.exit(3);
  }
  if (dryRun) {
    console.log(JSON.stringify(result.brief, null, 2));
    return;
  }

  writeJson(PATHS.brief, result.brief);
  writeJson(PATHS.state, result.state);
  const tasks = loadBacklog().map((t) =>
    t.id === result.task.id ? { ...t, status: "in_progress" } : t,
  );
  saveBacklog(tasks);
  console.log(
    `Planned Refactor Cycle ${result.brief.cycleNumber}: ${result.brief.taskId} (${result.brief.execution})`,
  );
}

main();
