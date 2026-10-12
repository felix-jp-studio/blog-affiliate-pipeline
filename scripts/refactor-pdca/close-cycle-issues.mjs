#!/usr/bin/env node
/**
 * Close the Refactor PDCA agent issues a merged PR resolves.
 * Run by the gatekeeper after it squash-merges, where `Closes #n` does not fire.
 *
 * Env: PR_NUMBER, GITHUB_REPOSITORY, GH_TOKEN
 */
import { execFileSync } from "node:child_process";
import { closeIssuesForPr } from "../lib/pdca-issues.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const LABEL = "refactor-pdca-auto";
const PR_NUMBER = process.env.PR_NUMBER;
const REPO = process.env.GITHUB_REPOSITORY;

if (!PR_NUMBER || !REPO) {
  console.error("PR_NUMBER and GITHUB_REPOSITORY are required");
  process.exit(2);
}

function gh(args) {
  return execFileSync("gh", args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN },
  });
}

const pr = JSON.parse(
  gh(["pr", "view", PR_NUMBER, "--repo", REPO, "--json", "title,url"]),
);
const issues = JSON.parse(
  gh([
    "issue",
    "list",
    "--repo",
    REPO,
    "--state",
    "open",
    "--label",
    LABEL,
    "--json",
    "number,title",
  ]),
);

const closed = closeIssuesForPr({
  issues,
  prTitle: pr.title,
  prUrl: pr.url,
  repo: REPO,
  run: gh,
  log: (line) => console.log(line),
});

console.log(
  closed.length > 0
    ? `Closed ${closed.length} issue(s) for "${pr.title}"`
    : `No open refactor-pdca-auto issue matches "${pr.title}"`,
);
