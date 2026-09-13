/**
 * Weekly rewrite queue runner.
 *
 * Reads data/rewrite-queue.csv and selects the next pending row.
 * Applies meta title/description backfill for the slug and updates dateModified.
 * Exits 0 when the queue is empty (no failure).
 *
 * Usage:
 *   node scripts/rewrite-weekly.mjs
 *   node scripts/rewrite-weekly.mjs --dry-run
 *   node scripts/rewrite-weekly.mjs --create-pr   # CI: branch + commit + gh pr create
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./e2e/e2e-utils.mjs";
import {
  REWRITE_QUEUE_HEADERS,
  markRowDone,
  parseQueue,
  selectNextPending,
  serializeQueue,
  withDateModified,
} from "./rewrite/queue.mjs";

const queuePath = join(repoRoot, "data/rewrite-queue.csv");
const articlesDir = join(repoRoot, "site/src/content/articles");
const dryRun = process.argv.includes("--dry-run");
const createPr = process.argv.includes("--create-pr");

function loadQueue() {
  if (!existsSync(queuePath)) {
    return { headers: REWRITE_QUEUE_HEADERS, rows: [] };
  }

  return parseQueue(readFileSync(queuePath, "utf8"));
}

function saveQueue(headers, rows) {
  if (dryRun) {
    console.log("rewrite-weekly: dry-run — queue not written");
    return;
  }
  writeFileSync(queuePath, serializeQueue(headers, rows), "utf8");
}

function touchDateModified(slug) {
  const path = join(articlesDir, `${slug}.md`);
  if (!existsSync(path)) {
    throw new Error(`article not found: ${path}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  let updated;
  try {
    updated = withDateModified(readFileSync(path, "utf8"), today);
  } catch {
    throw new Error(`frontmatter missing: ${path}`);
  }

  if (updated === null) {
    return false;
  }

  writeFileSync(path, updated, "utf8");
  return true;
}

function runMetaBackfill(slug) {
  const output = execFileSync(
    "python3",
    ["scripts/backfill-meta-titles.py", "--slug", slug],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, PYTHONPATH: "packages/generator" },
    },
  );
  return output;
}

function runGh(args) {
  return execFileSync("./scripts/gh-user.sh", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const { headers, rows } = loadQueue();
const next = selectNextPending(rows);

if (!next) {
  console.log("rewrite-weekly: queue empty — nothing to rewrite (exit 0)");
  process.exit(0);
}

const slug = next.slug?.trim();
if (!slug) {
  console.error("rewrite-weekly: next row missing slug");
  process.exit(1);
}

console.log(
  `rewrite-weekly: next slug=${slug} query=${next.query || "-"} position=${next.position || "-"}`,
);

if (dryRun) {
  execFileSync(
    "python3",
    ["scripts/backfill-meta-titles.py", "--slug", slug, "--dry-run"],
    {
      cwd: repoRoot,
      stdio: "inherit",
      env: { ...process.env, PYTHONPATH: "packages/generator" },
    },
  );
  console.log("rewrite-weekly: dry-run — no files or queue updated");
  process.exit(0);
}

const articlePath = join(articlesDir, `${slug}.md`);
if (!existsSync(articlePath)) {
  console.error(`rewrite-weekly: article missing for slug=${slug}`);
  process.exit(1);
}

const backfillOutput = runMetaBackfill(slug);
console.log(backfillOutput.trim());

const touchedDate = touchDateModified(slug);
if (touchedDate) {
  console.log(`rewrite-weekly: dateModified updated for ${slug}`);
}

const updatedRows = markRowDone(rows, slug);
saveQueue(headers, updatedRows);

if (!createPr) {
  console.log(`rewrite-weekly: completed meta rewrite for ${slug} (local mode)`);
  process.exit(0);
}

const branch = `rewrite/meta-${slug}-${new Date().toISOString().slice(0, 10)}`;
execFileSync("git", ["checkout", "-b", branch], { cwd: repoRoot, stdio: "inherit" });
execFileSync(
  "git",
  ["add", `site/src/content/articles/${slug}.md`, "data/rewrite-queue.csv"],
  { cwd: repoRoot, stdio: "inherit" },
);

try {
  execFileSync("git", ["diff", "--cached", "--quiet"], { cwd: repoRoot });
  console.log("rewrite-weekly: no meta changes — skipping PR");
  process.exit(0);
} catch {
  // staged changes present
}

execFileSync(
  "git",
  ["commit", "-m", `chore(rewrite): meta title/description for ${slug}`],
  { cwd: repoRoot, stdio: "inherit" },
);
runGh(["git", "push", "-u", "origin", branch]);

const prBody = [
  "## Summary",
  `- GSC リライトキューから \`${slug}\` の title/description を v1 テンプレで更新`,
  `- \`dateModified\` を本日に更新`,
  `- \`data/rewrite-queue.csv\` の status を \`done\` に更新`,
  "",
  "## Test plan",
  "- [ ] CI green",
  "- [ ] 記事 frontmatter の title/description が意図どおり",
].join("\n");

const prUrl = runGh([
  "pr",
  "create",
  "--title",
  `chore(rewrite): meta update ${slug}`,
  "--body",
  prBody,
  "--label",
  "cursor-agent",
]).trim();

console.log(`rewrite-weekly: PR created ${prUrl}`);
