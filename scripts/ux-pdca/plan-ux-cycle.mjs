#!/usr/bin/env node
/**
 * Plan the next UX PDCA cycle (Plan phase).
 *
 * Usage:
 *   node scripts/ux-pdca/plan-ux-cycle.mjs
 *   node scripts/ux-pdca/plan-ux-cycle.mjs --dry-run
 */
import {
  PATHS,
  DEFAULT_SCOPE,
  MAX_DIFF_LINES,
  MAX_FILES,
  buildAgentPrompt,
  loadBacklog,
  pendingTasks,
  readJson,
  saveBacklog,
  writeJson,
} from "./lib.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

function selectTask(metrics, state) {
  const tasks = loadBacklog();
  let candidates = pendingTasks(tasks);

  if (!metrics.cwvRegression) {
    candidates = candidates.filter((t) => t.trigger !== "cwv_regression");
  }

  if (metrics.cwvRegression) {
    const cwvTask = candidates.find((t) => t.id === "cwv-regression-fix");
    if (cwvTask) return cwvTask;
  }

  if (metrics.visualTestStatus === "fail") {
    const visualTask = candidates.find(
      (t) => t.category === "maintenance" && t.execution === "script",
    );
    if (visualTask) return visualTask;
  }

  return candidates[0] ?? null;
}

function planCycle() {
  const state = readJson(PATHS.state, {
    cycleNumber: 1,
    consecutiveFailures: 0,
    blockers: [],
    paused: false,
  });

  if (state.paused) {
    return { action: "skip", reason: "UX PDCA paused", state };
  }

  if (state.consecutiveFailures >= 3) {
    state.paused = true;
    state.blockers = [...(state.blockers ?? []), "3 consecutive UX cycle failures"];
    return { action: "pause", reason: "consecutiveFailures >= 3", state };
  }

  const metrics = state.metrics ?? {
    backlogPending: loadBacklog().filter((t) => t.status === "pending").length,
    openUxPrs: 0,
    cwvRegression: false,
    visualTestStatus: "skipped",
  };

  if (metrics.openUxPrs > 0) {
    return {
      action: "skip",
      reason: `Open UX PRs: ${metrics.openUxPrs}`,
      state,
      metrics,
    };
  }

  const task = selectTask(metrics, state);
  if (!task) {
    return { action: "escalate", reason: "No pending UX backlog tasks", state, metrics };
  }

  const brief = {
    cycleNumber: state.cycleNumber,
    taskId: task.id,
    title: task.title,
    execution: task.execution ?? "agent",
    scope: {
      allow: task.targetPaths ?? DEFAULT_SCOPE.allow,
      deny: DEFAULT_SCOPE.deny,
    },
    maxDiffLines: MAX_DIFF_LINES,
    maxFiles: MAX_FILES,
    visualPages: task.visualPages ?? [],
    acceptance: task.acceptance ?? [],
    agentPrompt: buildAgentPrompt(task, state.cycleNumber),
    createdAt: new Date().toISOString(),
  };

  state.lastOutcome = "planned";
  state.nextTaskId = task.id;
  return { action: "plan", brief, task, state, metrics };
}

function main() {
  const result = planCycle();
  console.log(JSON.stringify({ action: result.action, reason: result.reason ?? null }));

  if (result.action === "skip" || result.action === "pause") {
    if (!dryRun) writeJson(PATHS.state, result.state);
    process.exit(result.action === "pause" ? 2 : 0);
  }

  if (result.action === "escalate") {
    if (!dryRun) {
      writeJson(PATHS.state, { ...result.state, lastOutcome: "plan-escalate" });
    }
    process.exit(3);
  }

  if (dryRun) {
    console.log(JSON.stringify(result.brief, null, 2));
    return;
  }

  writeJson(PATHS.brief, result.brief);
  writeJson(PATHS.state, result.state);

  const tasks = loadBacklog().map((task) =>
    task.id === result.task.id ? { ...task, status: "in_progress" } : task,
  );
  saveBacklog(tasks);

  console.log(
    `Planned UX Cycle ${result.brief.cycleNumber}: ${result.brief.taskId} (${result.brief.execution})`,
  );
}

main();
