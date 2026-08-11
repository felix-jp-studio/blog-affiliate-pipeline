#!/usr/bin/env node
/**
 * Sync Visitability Cycle completion to blog-affiliate-auto roadmap-progress.json.
 *
 * Usage:
 *   node scripts/visitability/sync-roadmap-progress.mjs --cycle=32
 *   ROADMAP_REPO=/path/to/blog-affiliate-auto node scripts/visitability/sync-roadmap-progress.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";
import { PATHS, readJson } from "./lib.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRoadmapRepo = join(scriptDir, "../../../blog-affiliate-auto");
const roadmapRepo = process.env.ROADMAP_REPO ?? defaultRoadmapRepo;
const roadmapPath = join(roadmapRepo, "config/roadmap-progress.json");

const cycleArg = process.argv.find((arg) => arg.startsWith("--cycle="));
const dryRun = process.argv.includes("--dry-run");
const cycleNumber = cycleArg
  ? Number.parseInt(cycleArg.slice("--cycle=".length), 10)
  : readJson(PATHS.state, { cycleNumber: 32 }).cycleNumber - 1;

const result = readJson(join(repoRoot, "data/visitability-cycle-result.json"));

function appendPdcaLog(entry) {
  const header = existsSync(PATHS.pdcaLog)
    ? ""
    : "# Visitability PDCA log\n\n| Date | Cycle | Template | Slugs | Outcome |\n| --- | ---: | --- | --- | --- |\n";
  if (!existsSync(PATHS.pdcaLog) && !dryRun) {
    writeFileSync(PATHS.pdcaLog, header, "utf8");
  }
  const line = `| ${entry.date} | ${entry.cycle} | ${entry.template} | ${entry.slugs} | ${entry.outcome} |\n`;
  if (!dryRun) {
    appendFileSync(PATHS.pdcaLog, line, "utf8");
  }
  console.log(line.trim());
}

function updateRoadmap() {
  if (!existsSync(roadmapPath)) {
    console.warn(`Roadmap repo not found at ${roadmapPath}; skipping roadmap sync`);
    return { skipped: true };
  }

  const roadmap = JSON.parse(readFileSync(roadmapPath, "utf8"));
  const entryId = `visitability-cycle-${cycleNumber}`;
  const already = (roadmap.completed ?? []).some((item) => item.id === entryId);
  if (already) {
    console.log(`Roadmap already contains ${entryId}`);
    return { skipped: true, reason: "duplicate" };
  }

  roadmap.completed = roadmap.completed ?? [];
  roadmap.completed.push({
    id: entryId,
    label: `Visitability Cycle ${cycleNumber} (PDCA auto)`,
    date: new Date().toISOString().slice(0, 10),
    note: result?.slugs?.join(", ") ?? "",
  });
  roadmap.updatedAt = new Date().toISOString();

  if (dryRun) {
    console.log(JSON.stringify(roadmap.completed.slice(-1), null, 2));
    return { dryRun: true };
  }

  writeFileSync(roadmapPath, `${JSON.stringify(roadmap, null, 2)}\n`, "utf8");

  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
    try {
      const branch = `feature/visitability-roadmap-cycle-${cycleNumber}`;
      execFileSync("git", ["checkout", "-B", branch], {
        cwd: roadmapRepo,
        stdio: "inherit",
      });
      execFileSync("git", ["add", "config/roadmap-progress.json"], {
        cwd: roadmapRepo,
        stdio: "inherit",
      });
      execFileSync(
        "git",
        ["commit", "-m", `docs(roadmap): Visitability Cycle ${cycleNumber} complete`],
        { cwd: roadmapRepo, stdio: "inherit" },
      );
      execFileSync("git", ["push", "-u", "origin", branch], {
        cwd: roadmapRepo,
        stdio: "inherit",
      });
      execFileSync(
        "gh",
        [
          "pr",
          "create",
          "--title",
          `Roadmap: Visitability Cycle ${cycleNumber}`,
          "--body",
          `Automated roadmap sync after Visitability Cycle ${cycleNumber}.`,
        ],
        { cwd: roadmapRepo, stdio: "inherit" },
      );
    } catch (error) {
      console.warn(`Roadmap PR creation failed: ${error.message}`);
    }
  }

  return { updated: true };
}

appendPdcaLog({
  date: new Date().toISOString().slice(0, 10),
  cycle: cycleNumber,
  template: result?.template ?? "unknown",
  slugs: (result?.slugs ?? []).join(", ") || "—",
  outcome: "sync",
});

updateRoadmap();
