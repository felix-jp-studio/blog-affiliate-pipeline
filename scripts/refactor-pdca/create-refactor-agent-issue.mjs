#!/usr/bin/env node
/**
 * Create GitHub Issue for Refactor PDCA agent task.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { PATHS, readJson } from "./lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

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

  const url = execFileSync(
    "gh",
    [
      "issue",
      "create",
      "--repo",
      process.env.GITHUB_REPOSITORY ?? "felix-jp-studio/blog-affiliate-pipeline",
      "--title",
      `Refactor PDCA Cycle ${brief.cycleNumber}: ${brief.title}`,
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
