#!/usr/bin/env node
/**
 * Create GitHub Issue for Affiliate Sync agent cycle (human-in-the-loop ASP intake).
 *
 * Usage:
 *   node scripts/affiliate/create-affiliate-agent-issue.mjs
 *   node scripts/affiliate/create-affiliate-agent-issue.mjs --dry-run
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { AFFILIATE_PATHS, readJson } from "./lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const dryRun = process.argv.includes("--dry-run");

function appendLog(entry) {
  const header = existsSync(AFFILIATE_PATHS.pdcaLog)
    ? ""
    : "# Affiliate sync log\n\n| Date | Cycle | Programs | Outcome |\n| --- | ---: | --- | --- |\n";
  if (!existsSync(AFFILIATE_PATHS.pdcaLog) && !dryRun) {
    writeFileSync(AFFILIATE_PATHS.pdcaLog, header, "utf8");
  }
  const line = `| ${entry.date} | ${entry.cycle} | ${entry.programs} | ${entry.outcome} |\n`;
  if (!dryRun) appendFileSync(AFFILIATE_PATHS.pdcaLog, line, "utf8");
  console.log(line.trim());
}

function main() {
  const brief = readJson(AFFILIATE_PATHS.brief);
  if (!brief) {
    console.error("data/affiliate-sync-brief.json not found. Run affiliate:plan first.");
    process.exit(2);
  }

  const programNames = brief.tasks.map((t) => t.programKey).join(", ");
  const body = [
    "## Affiliate Sync Agent brief",
    "",
    `- Cycle: **${brief.cycleNumber}**`,
    `- Programs: ${programNames}`,
    `- Pending: ${brief.metrics?.pendingPrograms ?? 0} / Health alerts: ${brief.metrics?.healthAlerts ?? 0}`,
    "",
    brief.userChecklist,
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
    "### 次のステップ",
    "1. **ユーザー**: 上記チェックリストを完了し、ASP ペーストをコメントに貼る",
    "2. **Agent**: `affiliate:parse` → `affiliate:intake:dry-run` → intake PR",
    "3. レビュー → マージ → Vercel デプロイ",
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
      `Affiliate Sync Cycle ${brief.cycleNumber}: ${programNames}`,
      "--label",
      "affiliate-sync-auto",
      "--body",
      body,
    ],
    { cwd: repoRoot, encoding: "utf8" },
  ).trim();

  appendLog({
    date: new Date().toISOString().slice(0, 10),
    cycle: brief.cycleNumber,
    programs: programNames,
    outcome: `issue ${issueUrl}`,
  });

  console.log(`Created: ${issueUrl}`);
}

main();
