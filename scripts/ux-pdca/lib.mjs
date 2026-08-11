import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";

export const PATHS = {
  state: join(repoRoot, "config/ux-pdca-state.json"),
  backlog: join(repoRoot, "config/ux-backlog.json"),
  brief: join(repoRoot, "data/ux-cycle-brief.json"),
  cwvBaseline: join(repoRoot, "docs/operations/cwv-baseline.md"),
  pdcaLog: join(repoRoot, "docs/operations/ux-pdca-log.md"),
  siteDir: join(repoRoot, "site"),
  componentsDir: join(repoRoot, "site/src/components"),
  stylesDir: join(repoRoot, "site/src/styles"),
  visualTestsDir: join(repoRoot, "site/tests/visual"),
};

export const DEFAULT_SCOPE = {
  allow: [
    "site/src/components/",
    "site/src/styles/",
    "site/src/pages/",
    "site/src/layouts/",
    "site/tests/visual/",
    "site/playwright.config.ts",
  ],
  deny: ["site/src/content/articles/", "data/", "config/keywords"],
};

export const MAX_DIFF_LINES = 400;
export const MAX_FILES = 15;

export function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function loadBacklog() {
  const data = readJson(PATHS.backlog, { tasks: [] });
  return data.tasks ?? [];
}

export function saveBacklog(tasks) {
  writeJson(PATHS.backlog, {
    updatedAt: new Date().toISOString(),
    tasks,
  });
}

export function pendingTasks(tasks) {
  return tasks
    .filter((task) => task.status === "pending" || task.status === "in_progress")
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export function parseCwvBaseline(content) {
  const rows = [];
  for (const line of content.split("\n")) {
    if (!line.startsWith("| 2026-")) continue;
    const cols = line
      .split("|")
      .map((col) => col.trim())
      .filter(Boolean);
    if (cols.length < 10) continue;
    rows.push({
      week: cols[0],
      url: cols[2],
      perf: Number.parseFloat(cols[3]),
      lcp: Number.parseInt(cols[7], 10),
      cls: Number.parseFloat(cols[8]),
      tbt: Number.parseInt(cols[9], 10),
    });
  }
  return rows;
}

export function cwvRegressionFromBaseline(rows) {
  if (rows.length < 2) return { regression: false, reason: null };
  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  if (latest.perf < prev.perf - 0.05) {
    return { regression: true, reason: `Performance ${prev.perf} → ${latest.perf}` };
  }
  if (latest.cls > prev.cls + 0.05) {
    return { regression: true, reason: `CLS ${prev.cls} → ${latest.cls}` };
  }
  if (latest.lcp > prev.lcp + 500) {
    return { regression: true, reason: `LCP ${prev.lcp}ms → ${latest.lcp}ms` };
  }
  return { regression: false, reason: null };
}

export function buildAgentPrompt(task, cycleNumber) {
  return [
    `UX PDCA Cycle ${cycleNumber}: ${task.title}`,
    "",
    "## 目的",
    task.description ?? task.title,
    "",
    "## 対象パス",
    ...(task.targetPaths ?? []).map((path) => `- \`${path}\``),
    "",
    "## 禁止パス",
    ...DEFAULT_SCOPE.deny.map((path) => `- \`${path}\``),
    "",
    "## Visual 確認ページ",
    ...(task.visualPages ?? []).map((path) => `- ${path}`),
    "",
    "## 完了条件",
    ...(task.acceptance ?? [
      "npm run format:check --prefix site",
      "npm run test:e2e:visual --prefix site",
    ]),
    "",
    "## PR",
    `- ブランチ: \`feature/ux-pdca-${cycleNumber}\``,
    "- ラベル: `ux-pdca-auto`",
    `- タイトル: UX PDCA Cycle ${cycleNumber}: ${task.title}`,
  ].join("\n");
}
