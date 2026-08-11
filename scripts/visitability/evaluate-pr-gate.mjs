#!/usr/bin/env node
/**
 * Evaluate Visitability Cycle PRs for auto gatekeeper:
 * - pass    → squash merge
 * - fail    → close PR
 * - pending → wait for remaining checks
 * - skip    → not a visitability-managed PR
 */
import { execFileSync } from "node:child_process";

const PR_NUMBER = process.env.PR_NUMBER;
const REPO = process.env.GITHUB_REPOSITORY;

if (!PR_NUMBER || !REPO) {
  console.error("PR_NUMBER and GITHUB_REPOSITORY are required");
  process.exit(2);
}

const REQUIRED_CHECKS = ["validate", "playwright-visual"];
const VISUAL_PATH_PREFIXES = ["site/"];

const ALLOWED_PREFIXES = [
  "config/batch-cycle",
  "data/gsc-index-queue.json",
  "data/keywords.seed.csv",
  "state/generate-state.json",
  "site/src/content/articles/",
  "site/src/data/hub-article-mesh.ts",
  "site/src/components/",
  "site/src/styles/",
  "site/tests/",
  "site/package.json",
  "site/.prettierignore",
  "site/playwright.config.ts",
  "scripts/visitability/",
  "docs/operations/",
];

const ALLOWED_EXACT = [
  ".github/workflows/visitability-pr-gatekeeper.yml",
  ".github/workflows/visitability-pdca-orchestrator.yml",
  ".github/workflows/visitability-agent-cycle.yml",
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

function isVisitabilityPr(pr) {
  const branch = pr.headRefName ?? "";
  const title = pr.title ?? "";
  const labels = (pr.labels ?? []).map((label) => label.name);

  if (labels.includes("visitability-cycle-auto")) return true;
  if (/^feature\/visitability-(cycle|pdca|pr-)/i.test(branch)) return true;
  if (/^Visitability Cycle \d+/i.test(title)) return true;
  if (/^Fix CI:/i.test(title) && branch.startsWith("feature/visitability-")) {
    return true;
  }
  return false;
}

function isAllowedFile(path) {
  if (ALLOWED_EXACT.includes(path)) return true;
  return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function needsVisualChecks(files) {
  return files.some((file) =>
    VISUAL_PATH_PREFIXES.some((prefix) => file.startsWith(prefix)),
  );
}

function normalizeCheckName(name) {
  return name.trim().toLowerCase();
}

function main() {
  const prJson = gh([
    "pr",
    "view",
    PR_NUMBER,
    "--repo",
    REPO,
    "--json",
    "number,title,state,headRefName,labels,files",
  ]);
  const pr = JSON.parse(prJson);

  if (pr.state !== "OPEN") {
    emit({ verdict: "skip", reason: `PR #${PR_NUMBER} is ${pr.state}` });
    return;
  }

  if (!isVisitabilityPr(pr)) {
    emit({ verdict: "skip", reason: "Not a visitability-managed PR" });
    return;
  }

  const files = (pr.files ?? []).map((file) => file.path);
  const disallowed = files.filter((file) => !isAllowedFile(file));
  if (disallowed.length > 0) {
    emit({
      verdict: "fail",
      reason: `Disallowed paths: ${disallowed.join(", ")}`,
      failedChecks: ["file-allowlist"],
    });
    return;
  }

  const required = needsVisualChecks(files)
    ? REQUIRED_CHECKS
    : REQUIRED_CHECKS.filter((name) => name !== "playwright-visual");

  const checksRaw = gh(["pr", "checks", PR_NUMBER, "--repo", REPO]);
  const checks = [];
  for (const line of checksRaw.split("\n")) {
    if (!line.trim()) continue;
    const match = line.match(/^(\S+)\s+(pass|fail|pending|skipping|cancelled)\s/i);
    if (!match) continue;
    checks.push({
      name: match[1],
      state: match[2].toLowerCase(),
    });
  }

  const byName = new Map(
    checks.map((check) => [normalizeCheckName(check.name), check]),
  );

  const missing = [];
  const pending = [];
  const failed = [];

  for (const requiredName of required) {
    const check = byName.get(normalizeCheckName(requiredName));
    if (!check) {
      missing.push(requiredName);
      continue;
    }
    if (check.state === "pass") continue;
    if (check.state === "pending") {
      pending.push(requiredName);
      continue;
    }
    failed.push(`${requiredName} (${check.state})`);
  }

  if (pending.length > 0 || missing.length > 0) {
    emit({
      verdict: "pending",
      reason: "Waiting for required checks",
      pendingChecks: [...pending, ...missing],
      requiredChecks: required,
    });
    return;
  }

  if (failed.length > 0) {
    emit({
      verdict: "fail",
      reason: `Required checks failed: ${failed.join(", ")}`,
      failedChecks: failed,
      requiredChecks: required,
    });
    return;
  }

  emit({
    verdict: "pass",
    reason: "All required checks passed",
    requiredChecks: required,
  });
}

main();
