#!/usr/bin/env node
/**
 * Evaluate UX PDCA PRs for auto gatekeeper.
 */
import { execFileSync } from "node:child_process";
import { MAX_DIFF_LINES, MAX_FILES } from "./lib.mjs";

const PR_NUMBER = process.env.PR_NUMBER;
const REPO = process.env.GITHUB_REPOSITORY;

if (!PR_NUMBER || !REPO) {
  console.error("PR_NUMBER and GITHUB_REPOSITORY are required");
  process.exit(2);
}

const REQUIRED_CHECKS = ["validate", "playwright-visual"];
const FORBIDDEN_PREFIXES = [
  "site/src/content/articles/",
  "data/keywords",
  "data/gsc-",
  "config/batch-cycle",
];

const ALLOWED_PREFIXES = [
  "site/src/components/",
  "site/src/styles/",
  "site/src/pages/",
  "site/src/layouts/",
  "site/tests/visual/",
  "site/playwright.config.ts",
  "site/package.json",
  "site/.prettierignore",
  "scripts/ux-pdca/",
  "config/ux-",
  "data/ux-cycle-brief.json",
  "docs/operations/ux-pdca-log.md",
];

const ALLOWED_EXACT = [
  ".github/workflows/ux-pdca-orchestrator.yml",
  ".github/workflows/ux-agent-cycle.yml",
  ".github/workflows/ux-pr-gatekeeper.yml",
  "docs/ux-pdca-automation-design.html",
];

function gh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN },
  }).trim();
}

function emit(result) {
  console.log(JSON.stringify(result));
}

function isUxPdcaPr(pr) {
  const branch = pr.headRefName ?? "";
  const labels = (pr.labels ?? []).map((l) => l.name);
  if (labels.includes("ux-pdca-auto")) return true;
  if (/^feature\/ux-pdca/i.test(branch)) return true;
  if (/^UX PDCA Cycle \d+/i.test(pr.title ?? "")) return true;
  return false;
}

function isAllowedFile(path) {
  if (ALLOWED_EXACT.includes(path)) return true;
  if (FORBIDDEN_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
  return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function normalizeCheckName(name) {
  return name.trim().toLowerCase();
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
      reason: `Forbidden paths: ${forbidden.join(", ")}`,
      failedChecks: ["forbidden-paths"],
    });
    return;
  }

  const disallowed = files.filter((file) => !isAllowedFile(file));
  if (disallowed.length > 0) {
    emit({
      verdict: "fail",
      reason: `Disallowed paths: ${disallowed.join(", ")}`,
      failedChecks: ["file-allowlist"],
    });
    return;
  }

  if (files.length > MAX_FILES) {
    emit({
      verdict: "fail",
      reason: `Too many files: ${files.length} > ${MAX_FILES}`,
      failedChecks: ["max-files"],
    });
    return;
  }

  if (diffLines > MAX_DIFF_LINES) {
    emit({
      verdict: "fail",
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
    emit({
      verdict: "fail",
      reason: `Checks failed: ${failed.join(", ")}`,
      failedChecks: failed,
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
