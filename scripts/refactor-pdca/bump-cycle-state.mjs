#!/usr/bin/env node
import { PATHS, loadBacklog, readJson, saveBacklog, writeJson } from "./lib.mjs";

const state = readJson(PATHS.state, { cycleNumber: 1 });
const brief = readJson(PATHS.brief, {
  cycleNumber: state.cycleNumber,
  taskId: state.lastTaskId,
});

if (brief.taskId) {
  const tasks = loadBacklog().map((t) =>
    t.id === brief.taskId
      ? { ...t, status: "done", completedAt: new Date().toISOString() }
      : t,
  );
  saveBacklog(tasks);
}

state.cycleNumber = brief.cycleNumber + 1;
state.lastRunAt = new Date().toISOString();
state.lastOutcome = "success";
state.consecutiveFailures = 0;
writeJson(PATHS.state, state);
