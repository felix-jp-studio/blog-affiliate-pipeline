#!/usr/bin/env node
/**
 * Close out a UX PDCA cycle after its PR merges (Act phase).
 *
 * Without this the backlog task stays `in_progress` and pendingTasks() keeps
 * selecting it, so the orchestrator re-issues an agent issue for work that has
 * already shipped.
 */
import { PATHS, loadBacklog, readJson, saveBacklog, writeJson } from "./lib.mjs";

const state = readJson(PATHS.state, { cycleNumber: 1 });
const brief = readJson(PATHS.brief, {
  cycleNumber: state.cycleNumber,
  taskId: state.lastTaskId,
});

if (brief.taskId) {
  const tasks = loadBacklog().map((task) =>
    task.id === brief.taskId
      ? { ...task, status: "completed", completedAt: new Date().toISOString() }
      : task,
  );
  saveBacklog(tasks);
}

state.cycleNumber = brief.cycleNumber + 1;
state.lastRunAt = new Date().toISOString();
state.lastOutcome = "success";
state.lastTaskId = brief.taskId ?? state.lastTaskId;
state.consecutiveFailures = 0;
state.nextTaskId = null;
writeJson(PATHS.state, state);

console.log(
  `ux-pdca: cycle ${brief.cycleNumber} closed (${brief.taskId ?? "no task"}) → next cycle ${state.cycleNumber}`,
);
