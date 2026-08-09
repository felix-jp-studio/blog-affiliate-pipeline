/**
 * Seed rewrite-queue.csv without GSC CSV — picks stale comparison articles.
 *
 * Usage:
 *   node scripts/seed-rewrite-queue-heuristic.mjs
 *   node scripts/seed-rewrite-queue-heuristic.mjs --dry-run
 *   node scripts/seed-rewrite-queue-heuristic.mjs --limit=8
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadPublishedArticles, repoRoot } from "./e2e/e2e-utils.mjs";

const queuePath = join(repoRoot, "data/rewrite-queue.csv");
const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number.parseInt(limitArg.slice("--limit=".length), 10) : 8;

const headers = ["slug", "query", "position", "priority", "status", "notes"];

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers, rows: [] };
  }

  const parsedHeaders = lines[0].split(",").map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(
      parsedHeaders.map((header, index) => [header, values[index] ?? ""]),
    );
  });

  return { headers: parsedHeaders, rows };
}

function serializeCsv(parsedHeaders, rows) {
  const body = rows.map((row) =>
    parsedHeaders.map((header) => row[header] ?? "").join(","),
  );
  return `${[parsedHeaders.join(","), ...body].join("\n")}\n`;
}

function loadQueue() {
  if (!existsSync(queuePath)) {
    return { headers, rows: [] };
  }
  return parseCsv(readFileSync(queuePath, "utf8"));
}

const published = loadPublishedArticles().filter((article) => !article.draft);
const candidates = published
  .filter((article) => article.fields.articleType === "comparison")
  .map((article) => {
    const modified =
      article.fields.dateModified ?? article.fields.pubDate ?? "1970-01-01";
    return {
      slug: article.slug,
      keyword: article.fields.keyword ?? "",
      modified,
    };
  })
  .sort((a, b) => a.modified.localeCompare(b.modified) || a.slug.localeCompare(b.slug));

const { headers: queueHeaders, rows } = loadQueue();
const existingSlugs = new Set(rows.map((row) => row.slug));
const toAdd = candidates
  .filter((candidate) => !existingSlugs.has(candidate.slug))
  .slice(0, limit)
  .map((candidate, index) => ({
    slug: candidate.slug,
    query: candidate.keyword,
    position: "",
    priority: String(index + 1),
    status: "pending",
    notes: "heuristic-stale-meta",
  }));

if (toAdd.length === 0) {
  console.log("seed-rewrite-queue: no new rows to add");
  process.exit(0);
}

const nextRows = [...rows, ...toAdd];
console.log(`seed-rewrite-queue: adding ${toAdd.length} pending row(s)`);
for (const row of toAdd) {
  console.log(`  ${row.slug} (${row.query || "no keyword"})`);
}

if (dryRun) {
  console.log("seed-rewrite-queue: dry-run — queue not written");
  process.exit(0);
}

writeFileSync(queuePath, serializeCsv(queueHeaders, nextRows), "utf8");
console.log(`seed-rewrite-queue: wrote ${queuePath}`);
