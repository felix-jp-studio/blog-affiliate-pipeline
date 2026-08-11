import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";

export const PATHS = {
  state: join(repoRoot, "config/refactor-pdca-state.json"),
  backlog: join(repoRoot, "config/refactor-backlog.json"),
  brief: join(repoRoot, "data/refactor-cycle-brief.json"),
  pdcaLog: join(repoRoot, "docs/operations/refactor-pdca-log.md"),
};

export const MAX_DIFF_LINES = 300;
export const MAX_FILES = 15;

export const ALLOW_SCOPE = [
  "scripts/",
  "packages/",
  "config/refactor-",
  "config/e2e-",
  "config/batch-",
  ".github/workflows/refactor-",
  "docs/operations/refactor-pdca-log.md",
  "docs/refactor-pdca-automation-design.html",
];

export const DENY_SCOPE = [
  "site/src/content/articles/",
  "site/src/components/",
  "site/src/styles/",
  "data/keywords.seed.csv",
  "data/gsc-index-queue.json",
  ".env",
];

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
  writeJson(PATHS.backlog, { updatedAt: new Date().toISOString(), tasks });
}

export function pendingTasks(tasks) {
  return tasks
    .filter((t) => t.status === "pending" || t.status === "in_progress")
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export function countTodoComments() {
  let count = 0;
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, name.name);
      if (name.isDirectory()) {
        if (name.name === "node_modules" || name.name === "dist") continue;
        walk(path);
        continue;
      }
      if (!/\.(mjs|js|py|ts)$/.test(name.name)) continue;
      const content = readFileSync(path, "utf8");
      count += (content.match(/\bTODO\b/g) ?? []).length;
    }
  }
  walk(join(repoRoot, "scripts"));
  walk(join(repoRoot, "packages"));
  return count;
}

export function countFormatDrift() {
  try {
    execFileSync("npx", ["prettier", "--check", "scripts/", "packages/"], {
      cwd: repoRoot,
      stdio: "pipe",
    });
    return 0;
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    const match = output.match(/(\d+) files?/);
    if (match) return Number.parseInt(match[1], 10);
    return (output.match(/\[warn\]/g) ?? []).length || 1;
  }
}

export function countOpenRefactorPrs() {
  if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) return 0;
  try {
    const output = execFileSync(
      "gh",
      [
        "pr",
        "list",
        "--state",
        "open",
        "--label",
        "refactor-pdca-auto",
        "--json",
        "number",
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          GH_TOKEN: process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN,
        },
      },
    );
    return JSON.parse(output).length;
  } catch {
    return 0;
  }
}

export function buildAgentPrompt(task, cycleNumber) {
  return [
    `Refactor PDCA Cycle ${cycleNumber}: ${task.title}`,
    "",
    task.description ?? "",
    "",
    "## 対象パス",
    ...(task.targetPaths ?? []).map((p) => `- \`${p}\``),
    "",
    "## 禁止パス",
    ...DENY_SCOPE.map((p) => `- \`${p}\``),
    "",
    "## 完了条件",
    ...(task.acceptance ?? ["npm test", "npm run format:check"]),
    "",
    "## PR",
    `- ブランチ: \`feature/refactor-pdca-${cycleNumber}\``,
    "- ラベル: `refactor-pdca-auto`",
    `- タイトル: Refactor PDCA Cycle ${cycleNumber}: ${task.title}`,
    `- diff 上限: ${MAX_DIFF_LINES} 行 / ${MAX_FILES} ファイル`,
  ].join("\n");
}

export function selectTask(metrics) {
  if (metrics.formatDriftFiles > 0) {
    const task = loadBacklog().find((t) => t.id === "root-prettier-scripts-drift");
    if (task?.status === "pending") return { task, reason: "prettier drift in scripts/" };
  }
  const candidates = pendingTasks(loadBacklog()).filter(
    (t) => t.id !== "root-prettier-scripts-drift",
  );
  if (candidates.length === 0) return { task: null, reason: "backlog empty" };
  return { task: candidates[0], reason: `backlog priority ${candidates[0].priority}` };
}
