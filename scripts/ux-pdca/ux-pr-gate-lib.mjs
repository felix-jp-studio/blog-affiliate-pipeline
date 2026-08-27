/**
 * Shared UX PR gatekeeper allowlist and repair planning.
 */

export const REQUIRED_CHECKS = ["validate", "playwright-visual"];

export const FORBIDDEN_PREFIXES = [
  "site/src/content/articles/",
  "data/keywords",
  "data/gsc-",
  "config/batch-cycle",
];

export const ALLOWED_PREFIXES = [
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

export const ALLOWED_EXACT = [
  ".github/workflows/ux-pdca-orchestrator.yml",
  ".github/workflows/ux-agent-cycle.yml",
  ".github/workflows/ux-pr-gatekeeper.yml",
  ".github/pr-visual-diffs/.gitkeep",
  "docs/ux-pdca-automation-design.html",
];

export const PR_VISUAL_DIFFS_PREFIX = ".github/pr-visual-diffs/";
export const GATEKEEPER_REPAIR_COMMIT_PREFIX = "chore(ux-gatekeeper):";

export function isUxPdcaPr(pr) {
  const branch = pr.headRefName ?? "";
  const labels = (pr.labels ?? []).map((l) => l.name);
  if (labels.includes("ux-pdca-auto")) return true;
  if (/^feature\/ux-pdca/i.test(branch)) return true;
  if (/^UX PDCA Cycle \d+/i.test(pr.title ?? "")) return true;
  return false;
}

export function isAllowedFile(path) {
  if (ALLOWED_EXACT.includes(path)) return true;
  if (FORBIDDEN_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
  return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function normalizeCheckName(name) {
  return name.trim().toLowerCase();
}

export function disallowedFiles(files) {
  return files.filter((file) => !isAllowedFile(file));
}

export function isPrVisualDiffArtifact(path) {
  return (
    path.startsWith(PR_VISUAL_DIFFS_PREFIX) && path !== ".github/pr-visual-diffs/.gitkeep"
  );
}

/**
 * @param {{ failedChecks?: string[] }} failResult
 * @param {string[]} files
 * @returns {string[]}
 */
export function planUxPrRepairs(failResult, files) {
  const actions = [];
  const failedChecks = failResult.failedChecks ?? [];
  const blocked = disallowedFiles(files);
  const visualDiffArtifacts = blocked.filter(isPrVisualDiffArtifact);

  if (
    failedChecks.includes("file-allowlist") &&
    visualDiffArtifacts.length > 0 &&
    visualDiffArtifacts.length === blocked.length
  ) {
    actions.push("remove-pr-visual-diffs");
  }

  if (failedChecks.some((name) => name.startsWith("playwright-visual"))) {
    actions.push("update-visual-baselines");
  }

  if (failedChecks.some((name) => name.startsWith("validate"))) {
    actions.push("format-site");
  }

  return actions;
}

/**
 * @param {{ failedChecks?: string[] }} failResult
 * @param {string[]} files
 */
export function isUxPrRepairable(failResult, files) {
  if (failResult.failedChecks?.includes("forbidden-paths")) return false;
  if (failResult.failedChecks?.includes("max-files")) return false;
  if (failResult.failedChecks?.includes("max-diff")) return false;
  return planUxPrRepairs(failResult, files).length > 0;
}

export function isRecentGatekeeperRepairCommit(message) {
  return (message ?? "").startsWith(GATEKEEPER_REPAIR_COMMIT_PREFIX);
}
