#!/usr/bin/env node
/**
 * Dispatch Visitability Act by actType from visitability-act-brief.json.
 */
import { execFileSync } from "node:child_process";
import { PATHS, readJson } from "./lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const brief = readJson(PATHS.actBrief);
if (!brief?.actType) {
  console.error("visitability-act-brief.json missing actType");
  process.exit(2);
}

const runners = {
  article_cycle: "run-cycle.mjs",
  index_push: "run-index-push.mjs",
  rewrite_cycle: "run-rewrite-cycle.mjs",
  internal_link_boost: "run-internal-link-boost.mjs",
  meta_ctr_agent: "create-visitability-agent-issue.mjs",
};

const script = runners[brief.actType];
if (!script) {
  console.error(`Unknown actType: ${brief.actType}`);
  process.exit(2);
}

execFileSync("node", [`scripts/visitability/${script}`], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (brief.actType !== "article_cycle") {
  execFileSync("node", ["scripts/visitability/bump-cycle-state.mjs"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

console.log(JSON.stringify({ actType: brief.actType, outcome: "completed" }));
