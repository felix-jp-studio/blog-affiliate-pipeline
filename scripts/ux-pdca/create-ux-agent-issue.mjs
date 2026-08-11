#!/usr/bin/env node
/**
 * Create GitHub Issue for Cursor Cloud Agent UX cycle.
 *
 * Usage:
 *   node scripts/ux-pdca/create-ux-agent-issue.mjs
 *   node scripts/ux-pdca/create-ux-agent-issue.mjs --dry-run
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, appendFileSync, existsSync } from "node:fs";
import { PATHS, readJson } from "./lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

function appendLog(entry) {
  const header = existsSync(PATHS.pdcaLog)
    ? ""
    : "# UX PDCA log\n\n| Date | Cycle | Task | Execution | Outcome |\n| --- | ---: | --- | --- | --- |\n";
  if (!existsSync(PATHS.pdcaLog) && !dryRun) {
    writeFileSync(PATHS.pdcaLog, header, "utf8");
  }
  const line = `| ${entry.date} | ${entry.cycle} | ${entry.task} | ${entry.execution} | ${entry.outcome} |\n`;
  if (!dryRun) appendFileSync(PATHS.pdcaLog, line, "utf8");
  console.log(line.trim());
}

function main() {
  const brief = readJson(PATHS.brief);
  if (!brief) {
    console.error("data/ux-cycle-brief.json not found");
    process.exit(2);
  }

  const body = [
    "## UX PDCA Agent brief",
    "",
    `- Cycle: **${brief.cycleNumber}**`,
    `- Task: \`${brief.taskId}\` — ${brief.title}`,
    "",
    "### Agent prompt",
    "",
    brief.agentPrompt,
    "",
    "### Brief JSON",
    "",
    "```json",
    JSON.stringify(brief, null, 2),
    "```",
    "",
    "### 手順",
    "1. 上記 scope 内のみ変更（記事 md 禁止）",
    "2. `npm run format:check --prefix site`",
    "3. `npm run test:e2e:visual --prefix site`",
    `4. PR: ブランチ \`feature/ux-pdca-${brief.cycleNumber}\`、ラベル \`ux-pdca-auto\``,
  ].join("\n");

  if (dryRun) {
    console.log(body);
    return;
  }

  if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
    console.error("GH_TOKEN required to create issue");
    process.exit(2);
  }

  const issueUrl = execFileSync(
    "gh",
    [
      "issue",
      "create",
      "--repo",
      process.env.GITHUB_REPOSITORY ?? "felix-jp-studio/blog-affiliate-pipeline",
      "--title",
      `UX PDCA Cycle ${brief.cycleNumber}: ${brief.title}`,
      "--label",
      "ux-pdca-auto",
      "--body",
      body,
    ],
    { cwd: repoRoot, encoding: "utf8" },
  ).trim();

  appendLog({
    date: new Date().toISOString().slice(0, 10),
    cycle: brief.cycleNumber,
    task: brief.taskId,
    execution: "agent",
    outcome: `issue ${issueUrl}`,
  });

  console.log(`Created: ${issueUrl}`);
}

main();
