#!/usr/bin/env node
/**
 * Evaluate Refactor PDCA PRs for gatekeeper.
 */
import { execFileSync } from "node:child_process";
import { ALLOW_SCOPE, DENY_SCOPE, MAX_DIFF_LINES, MAX_FILES } from "./lib.mjs";

const PR_NUMBER = process.env.PR_NUMBER;
const REPO = process.env.GITHUB_REPOSITORY;

if (!PR_NUMBER || !REPO) process.exit(2);

const REQUIRED_CHECKS = ["validate"];

function gh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN },
  }).trim();
}

function emit(result) {
  console.log(JSON.stringify(result));
}

function isRefactorPr(pr) {
  const branch = pr.headRefName ?? "";
  const labels = (pr.labels ?? []).map((l) => l.name);
  if (labels.includes("refactor-pdca-auto")) return true;
  if (/^feature\/refactor-pdca/i.test(branch)) return true;
  if (/^Refactor PDCA Cycle \d+/i.test(pr.title ?? "")) return true;
  return false;
}

function isAllowed(path) {
  if (DENY_SCOPE.some((p) => path.startsWith(p))) return false;
  if (path.startsWith("scripts/refactor-pdca/")) return true;
  if (path.startsWith("config/refactor-")) return true;
  if (path.startsWith("data/refactor-cycle-brief.json")) return true;
  if (path.startsWith("docs/refactor-pdca-automation-design.html")) return true;
  if (path.startsWith("docs/operations/refactor-pdca-log.md")) return true;
  if (path.startsWith(".github/workflows/refactor-")) return true;
  return ALLOW_SCOPE.some((p) => path.startsWith(p));
}

function main() {
  const pr = JSON.parse(
    gh([
      "pr",
      "view",
      PR_NUMBER,
      "--repo",
      REPO,
      "--json",
      "number,title,state,headRefName,labels,files,additions,deletions",
    ]),
  );

  if (pr.state !== "OPEN") {
    emit({ verdict: "skip", reason: `PR #${PR_NUMBER} is ${pr.state}` });
    return;
  }
  if (!isRefactorPr(pr)) {
    emit({ verdict: "skip", reason: "Not a refactor PDCA PR" });
    return;
  }

  const files = (pr.files ?? []).map((f) => f.path);
  const diffLines = (pr.additions ?? 0) + (pr.deletions ?? 0);

  const forbidden = files.filter((f) => DENY_SCOPE.some((p) => f.startsWith(p)));
  if (forbidden.length) {
    emit({ verdict: "fail", reason: `Forbidden: ${forbidden.join(", ")}` });
    return;
  }
  const disallowed = files.filter((f) => !isAllowed(f));
  if (disallowed.length) {
    emit({ verdict: "fail", reason: `Disallowed: ${disallowed.join(", ")}` });
    return;
  }
  if (files.length > MAX_FILES) {
    emit({ verdict: "fail", reason: `Too many files: ${files.length}` });
    return;
  }
  if (diffLines > MAX_DIFF_LINES) {
    emit({ verdict: "fail", reason: `Diff too large: ${diffLines}` });
    return;
  }

  const checksRaw = gh(["pr", "checks", PR_NUMBER, "--repo", REPO]);
  const byName = new Map();
  for (const line of checksRaw.split("\n")) {
    const m = line.match(/^(\S+)\s+(pass|fail|pending|skipping|cancelled)\s/i);
    if (m) byName.set(m[1].trim().toLowerCase(), m[2].toLowerCase());
  }

  const pending = [];
  const failed = [];
  for (const name of REQUIRED_CHECKS) {
    const state = byName.get(name.toLowerCase());
    if (!state) pending.push(name);
    else if (state === "pass") continue;
    else if (state === "pending") pending.push(name);
    else failed.push(name);
  }

  if (pending.length) {
    emit({ verdict: "pending", reason: "Waiting for checks", pendingChecks: pending });
    return;
  }
  if (failed.length) {
    emit({ verdict: "fail", reason: `Failed: ${failed.join(", ")}` });
    return;
  }
  emit({ verdict: "pass", reason: "All checks passed" });
}

main();
