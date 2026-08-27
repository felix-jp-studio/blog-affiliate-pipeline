#!/usr/bin/env node
/**
 * Evaluate UX PDCA PRs for auto gatekeeper.
 */
import { execFileSync } from "node:child_process";
import { MAX_DIFF_LINES, MAX_FILES } from "./lib.mjs";
import {
  REQUIRED_CHECKS,
  FORBIDDEN_PREFIXES,
  isAllowedFile,
  isUxPdcaPr,
  isUxPrRepairable,
  isRecentGatekeeperRepairCommit,
  normalizeCheckName,
  planUxPrRepairs,
} from "./ux-pr-gate-lib.mjs";

const PR_NUMBER = process.env.PR_NUMBER;
const REPO = process.env.GITHUB_REPOSITORY;

if (!PR_NUMBER || !REPO) {
  console.error("PR_NUMBER and GITHUB_REPOSITORY are required");
  process.exit(2);
}

function gh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN },
  }).trim();
}

function emit(result) {
  console.log(JSON.stringify(result));
}

function latestCommitMessage(headRefName) {
  try {
    return gh([
      "api",
      `repos/${REPO}/commits/${headRefName}`,
      "--jq",
      '.commit.message | split("\\n")[0]',
    ]);
  } catch {
    return "";
  }
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

  if (!isUxPdcaPr(pr)) {
    emit({ verdict: "skip", reason: "Not a UX PDCA PR" });
    return;
  }

  const files = (pr.files ?? []).map((f) => f.path);
  const diffLines = (pr.additions ?? 0) + (pr.deletions ?? 0);

  const forbidden = files.filter((file) =>
    FORBIDDEN_PREFIXES.some((prefix) => file.startsWith(prefix)),
  );
  if (forbidden.length > 0) {
    emit({
      verdict: "fail",
      repairable: false,
      reason: `Forbidden paths: ${forbidden.join(", ")}`,
      failedChecks: ["forbidden-paths"],
    });
    return;
  }

  const disallowed = files.filter((file) => !isAllowedFile(file));
  if (disallowed.length > 0) {
    const failResult = {
      failedChecks: ["file-allowlist"],
      reason: `Disallowed paths: ${disallowed.join(", ")}`,
    };
    const recentRepair = isRecentGatekeeperRepairCommit(
      latestCommitMessage(pr.headRefName),
    );
    const repairable = isUxPrRepairable(failResult, files) && !recentRepair;
    emit({
      verdict: "fail",
      repairable,
      reason: failResult.reason,
      failedChecks: failResult.failedChecks,
      repairActions: planUxPrRepairs(failResult, files),
      skipRepairReason: recentRepair
        ? "recent-gatekeeper-repair-commit"
        : repairable
          ? null
          : "not-auto-fixable",
    });
    return;
  }

  if (files.length > MAX_FILES) {
    emit({
      verdict: "fail",
      repairable: false,
      reason: `Too many files: ${files.length} > ${MAX_FILES}`,
      failedChecks: ["max-files"],
    });
    return;
  }

  if (diffLines > MAX_DIFF_LINES) {
    emit({
      verdict: "fail",
      repairable: false,
      reason: `Diff too large: ${diffLines} lines > ${MAX_DIFF_LINES}`,
      failedChecks: ["max-diff"],
    });
    return;
  }

  const checksRaw = gh(["pr", "checks", PR_NUMBER, "--repo", REPO]);
  const checks = [];
  for (const line of checksRaw.split("\n")) {
    if (!line.trim()) continue;
    const match = line.match(/^(\S+)\s+(pass|fail|pending|skipping|cancelled)\s/i);
    if (!match) continue;
    checks.push({ name: match[1], state: match[2].toLowerCase() });
  }

  const byName = new Map(checks.map((c) => [normalizeCheckName(c.name), c]));
  const pending = [];
  const failed = [];

  for (const requiredName of REQUIRED_CHECKS) {
    const check = byName.get(normalizeCheckName(requiredName));
    if (!check) {
      pending.push(requiredName);
      continue;
    }
    if (check.state === "pass") continue;
    if (check.state === "pending") {
      pending.push(requiredName);
      continue;
    }
    failed.push(`${requiredName} (${check.state})`);
  }

  if (pending.length > 0) {
    emit({ verdict: "pending", reason: "Waiting for checks", pendingChecks: pending });
    return;
  }

  if (failed.length > 0) {
    const failResult = {
      failedChecks: failed.map((entry) => entry.split(" ")[0]),
      reason: `Checks failed: ${failed.join(", ")}`,
    };
    const recentRepair = isRecentGatekeeperRepairCommit(
      latestCommitMessage(pr.headRefName),
    );
    const repairable = isUxPrRepairable(failResult, files) && !recentRepair;
    emit({
      verdict: "fail",
      repairable,
      reason: failResult.reason,
      failedChecks: failResult.failedChecks,
      repairActions: planUxPrRepairs(failResult, files),
      skipRepairReason: recentRepair
        ? "recent-gatekeeper-repair-commit"
        : repairable
          ? null
          : "not-auto-fixable",
    });
    return;
  }

  emit({
    verdict: "pass",
    reason: "All UX PDCA checks passed",
    requiredChecks: REQUIRED_CHECKS,
  });
}

main();
