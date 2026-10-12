#!/usr/bin/env node
/**
 * Create GitHub Issue for Refactor PDCA agent task.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { PATHS, findOpenIssueByTitle, readJson } from "./lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const REPO = process.env.GITHUB_REPOSITORY ?? "felix-jp-studio/blog-affiliate-pipeline";

/** Open issues this loop has already filed, so a replanned cycle is not refiled. */
function listOpenAgentIssues() {
  try {
    const output = execFileSync(
      "gh",
      [
        "issue",
        "list",
        "--repo",
        REPO,
        "--state",
        "open",
        "--label",
        "refactor-pdca-auto",
        "--json",
        "number,title,url",
      ],
      { cwd: repoRoot, encoding: "utf8" },
    );
    return JSON.parse(output);
  } catch {
    return [];
  }
}

function main() {
  const brief = readJson(PATHS.brief);
  if (!brief) process.exit(2);

  const body = [
    "## Refactor PDCA Agent brief",
    "",
    `- Cycle: **${brief.cycleNumber}**`,
    `- Task: \`${brief.taskId}\` — ${brief.title}`,
    `- Reason: ${brief.reason}`,
    "",
    brief.agentPrompt ?? "",
    "",
    "```json",
    JSON.stringify(brief, null, 2),
    "```",
  ].join("\n");

  if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
    console.log(body);
    return;
  }

  const title = `Refactor PDCA Cycle ${brief.cycleNumber}: ${brief.title}`;
  const existing = findOpenIssueByTitle(listOpenAgentIssues(), title);
  if (existing) {
    console.log(`Issue already open for this cycle: ${existing.url}`);
    return;
  }

  const url = execFileSync(
    "gh",
    [
      "issue",
      "create",
      "--repo",
      REPO,
      "--title",
      title,
      "--label",
      "refactor-pdca-auto",
      "--body",
      body,
    ],
    { cwd: repoRoot, encoding: "utf8" },
  ).trim();

  const header =
    "# Refactor PDCA log\n\n| Date | Cycle | Task | Outcome |\n| --- | ---: | --- | --- |\n";
  if (!existsSync(PATHS.pdcaLog)) writeFileSync(PATHS.pdcaLog, header, "utf8");
  appendFileSync(
    PATHS.pdcaLog,
    `| ${new Date().toISOString().slice(0, 10)} | ${brief.cycleNumber} | ${brief.taskId} | ${url} |\n`,
  );
  console.log(url);
}

main();
