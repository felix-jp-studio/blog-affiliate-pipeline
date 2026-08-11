#!/usr/bin/env node
import { PATHS, readJson, writeJson } from "./lib.mjs";

const state = readJson(PATHS.state, { cycleNumber: 1, consecutiveFailures: 0 });
const brief = readJson(PATHS.actBrief, {
  cycleNumber: state.cycleNumber,
  actType: "unknown",
});

state.cycleNumber = (brief.cycleNumber ?? state.cycleNumber) + 1;
state.lastRunAt = new Date().toISOString();
state.lastOutcome = "success";
state.lastActType = brief.actType;
state.consecutiveFailures = 0;
writeJson(PATHS.state, state);

console.log(
  JSON.stringify({ nextCycleNumber: state.cycleNumber, lastActType: brief.actType }),
);
