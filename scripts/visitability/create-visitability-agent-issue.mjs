#!/usr/bin/env node
/**
 * Create Agent Issue for meta/CTR improvements when rewrite queue is empty.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { PATHS, readJson } from "./lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

function main() {
  const brief = readJson(PATHS.actBrief);
  if (!brief) process.exit(2);

  const body = [
    "## Visitability PDCA: meta / CTR agent task",
    "",
    `- Cycle: **${brief.cycleNumber}**`,
    `- Reason: ${brief.reason}`,
    "",
    "GSC rewrite queue is empty. Pick 1–2 published articles with high impressions but low CTR",
    "and improve title/description (meta backfill v1 template).",
    "",
    "### Constraints",
    "- Do NOT change article body prose",
    "- Only frontmatter title/description + dateModified",
    "- PR branch: `feature/visitability-cycle" + brief.cycleNumber + "-meta`",
    "- Label: `visitability-cycle-auto`",
    "",
    "```json",
    JSON.stringify(brief, null, 2),
    "```",
  ].join("\n");

  if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
    console.log(body);
    process.exit(0);
  }

  const url = execFileSync(
    "gh",
    [
      "issue",
      "create",
      "--repo",
      process.env.GITHUB_REPOSITORY ?? "felix-jp-studio/blog-affiliate-pipeline",
      "--title",
      `Visitability Cycle ${brief.cycleNumber}: meta/CTR improvement`,
      "--label",
      "visitability-cycle-auto",
      "--body",
      body,
    ],
    { cwd: repoRoot, encoding: "utf8" },
  ).trim();

  const logHeader = existsSync(PATHS.pdcaLog)
    ? ""
    : "# Visitability PDCA log\n\n| Date | Cycle | Act | Outcome |\n| --- | ---: | --- | --- |\n";
  if (!existsSync(PATHS.pdcaLog)) writeFileSync(PATHS.pdcaLog, logHeader, "utf8");
  appendFileSync(
    PATHS.pdcaLog,
    `| ${new Date().toISOString().slice(0, 10)} | ${brief.cycleNumber} | meta_ctr_agent | ${url} |\n`,
  );
  console.log(url);
}

main();
