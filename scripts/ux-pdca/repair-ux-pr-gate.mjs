#!/usr/bin/env node
/**
 * Apply automatic repairs so UX PDCA PRs become mergeable.
 *
 * Usage:
 *   REPAIR_ACTIONS='["remove-pr-visual-diffs"]' node scripts/ux-pdca/repair-ux-pr-gate.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GATEKEEPER_REPAIR_COMMIT_PREFIX } from "./ux-pr-gate-lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const actions = JSON.parse(process.env.REPAIR_ACTIONS ?? "[]");
const headBranch = process.env.HEAD_BRANCH;

if (!Array.isArray(actions) || actions.length === 0) {
  console.log(JSON.stringify({ changed: false, reason: "no-actions" }));
  process.exit(0);
}

function run(cmd, args, options = {}) {
  execFileSync(cmd, args, { stdio: "inherit", ...options });
}

function git(args) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
}

function removePrVisualDiffs() {
  const dir = join(repoRoot, ".github/pr-visual-diffs");
  mkdirSync(dir, { recursive: true });
  for (const name of execFileSync("git", ["ls-files", ".github/pr-visual-diffs"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)) {
    if (name.endsWith(".gitkeep")) continue;
    rmSync(join(repoRoot, name), { force: true });
    run("git", ["rm", "-f", "--ignore-unmatch", name], { cwd: repoRoot, stdio: "pipe" });
  }
  const gitkeep = join(dir, ".gitkeep");
  if (!existsSync(gitkeep)) {
    writeFileSync(
      gitkeep,
      "# CI uploads Playwright screenshot diffs here for PR comment embedding.\n",
      "utf8",
    );
    run("git", ["add", ".github/pr-visual-diffs/.gitkeep"], {
      cwd: repoRoot,
      stdio: "pipe",
    });
  }
}

function formatSite() {
  run(
    "npx",
    [
      "prettier",
      "--write",
      "site/src/components",
      "site/src/styles",
      "site/src/pages",
      "site/src/layouts",
    ],
    { cwd: repoRoot },
  );
  run("npm", ["run", "format:check", "--prefix", "site"], { cwd: repoRoot });
}

function updateVisualBaselines() {
  run("npm", ["ci"], { cwd: join(repoRoot, "site") });
  run("npx", ["playwright", "install", "--with-deps", "chromium"], {
    cwd: join(repoRoot, "site"),
  });
  run("npm", ["run", "test:e2e:visual:update"], { cwd: join(repoRoot, "site") });
  run("npm", ["run", "test:e2e:visual"], { cwd: join(repoRoot, "site") });
}

function main() {
  for (const action of actions) {
    if (action === "remove-pr-visual-diffs") removePrVisualDiffs();
    else if (action === "format-site") formatSite();
    else if (action === "update-visual-baselines") updateVisualBaselines();
    else throw new Error(`Unknown repair action: ${action}`);
  }

  const status = git(["status", "--porcelain"]);
  if (!status) {
    console.log(JSON.stringify({ changed: false, actions }));
    return;
  }

  run("git", ["add", "-A"], { cwd: repoRoot, stdio: "pipe" });
  const message = `${GATEKEEPER_REPAIR_COMMIT_PREFIX} ${actions.join(", ")}`;
  run("git", ["commit", "-m", message], { cwd: repoRoot, stdio: "pipe" });
  if (!headBranch) {
    throw new Error("HEAD_BRANCH is required to push repair commits");
  }
  run("git", ["push", "origin", `HEAD:${headBranch}`], { cwd: repoRoot });

  console.log(
    JSON.stringify({
      changed: true,
      actions,
      commitMessage: message,
    }),
  );
}

main();
