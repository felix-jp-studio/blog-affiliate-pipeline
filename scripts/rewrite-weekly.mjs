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
  markRowStatus,
  parseQueue,
  pendingRows,
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

/** メタバックフィルが実際に書き換えを起こすかを、書き込まずに判定する。 */
function wouldChangeMeta(slug) {
  const output = execFileSync(
    "python3",
    ["scripts/backfill-meta-titles.py", "--slug", slug, "--dry-run"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, PYTHONPATH: "packages/generator" },
    },
  );
  return /Updated:\s*[1-9]/.test(output);
}

const { headers, rows } = loadQueue();

// pending を順に見て「実際にメタが変わる行」を探す。
// 既にテンプレートと一致している行を done にして dateModified を更新すると、
// 中身が変わっていないのに「更新した」という偽の鮮度シグナルを
// Article JSON-LD とメタタグに出すことになるため、skipped にして飛ばす。
const updates = new Map();
let target = null;

for (const row of pendingRows(rows)) {
  const candidate = row.slug?.trim();

  if (!candidate) {
    console.log("rewrite-weekly: row without slug, skipping");
    updates.set(row, { status: "skipped", notes: "missing slug" });
    continue;
  }

  if (!existsSync(join(articlesDir, `${candidate}.md`))) {
    console.log(`rewrite-weekly: ${candidate} — article file missing, skipping`);
    updates.set(row, { status: "skipped", notes: "article not found" });
    continue;
  }

  if (wouldChangeMeta(candidate)) {
    target = row;
    break;
  }

  console.log(`rewrite-weekly: ${candidate} — meta already matches template, skipping`);
  updates.set(row, { status: "skipped", notes: "meta already matches template" });
}

const workingRows = rows.map((row) =>
  updates.has(row) ? { ...row, ...updates.get(row) } : row,
);

if (updates.size > 0) {
  console.log(`rewrite-weekly: skipped ${updates.size} row(s) with no meta change`);
}

if (!target) {
  saveQueue(headers, workingRows);
  console.log("rewrite-weekly: no row needs a meta rewrite — nothing to do (exit 0)");
  process.exit(0);
}

const slug = target.slug.trim();
console.log(
  `rewrite-weekly: next slug=${slug} query=${target.query || "-"} position=${target.position || "-"}`,
);

if (dryRun) {
  console.log("rewrite-weekly: dry-run — no files or queue updated");
  process.exit(0);
}

const backfillOutput = runMetaBackfill(slug);
console.log(backfillOutput.trim());

const touchedDate = touchDateModified(slug);
if (touchedDate) {
  console.log(`rewrite-weekly: dateModified updated for ${slug}`);
}

const updatedRows = markRowDone(workingRows, slug);
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
