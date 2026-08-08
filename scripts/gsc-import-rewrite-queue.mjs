/**
 * Import GSC Search Analytics CSV → rewrite-queue.csv (position 11–30).
 *
 * Usage:
 *   node scripts/gsc-import-rewrite-queue.mjs --csv=data/gsc-performance-YYYYMMDD.csv
 *   node scripts/gsc-import-rewrite-queue.mjs --csv=... --dry-run
 *   node scripts/gsc-import-rewrite-queue.mjs --csv=... --min-position=11 --max-position=30
 *
 * GSC export: Performance → Search results → Queries → Export (28 days).
 * Accepts English headers (Query, Position) or lowercase variants.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadPublishedArticles, repoRoot } from "./e2e/e2e-utils.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const csvArg = args.find((a) => a.startsWith("--csv="));
const minPosArg = args.find((a) => a.startsWith("--min-position="));
const maxPosArg = args.find((a) => a.startsWith("--max-position="));

const minPosition = minPosArg
  ? Number.parseFloat(minPosArg.slice("--min-position=".length))
  : 11;
const maxPosition = maxPosArg
  ? Number.parseFloat(maxPosArg.slice("--max-position=".length))
  : 30;

const queuePath = join(repoRoot, "data/rewrite-queue.csv");

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].split(",").map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });

  return { headers, rows };
}

function serializeCsv(headers, rows) {
  const body = rows.map((row) => headers.map((header) => row[header] ?? "").join(","));
  return `${[headers.join(","), ...body].join("\n")}\n`;
}

function normalizeQuery(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function pickField(row, names) {
  for (const name of names) {
    const exact = row[name];
    if (exact !== undefined && exact !== "") {
      return exact;
    }
    const found = Object.entries(row).find(
      ([key]) => key.toLowerCase() === name.toLowerCase(),
    );
    if (found?.[1]) {
      return found[1];
    }
  }
  return "";
}

function loadQueue() {
  if (!existsSync(queuePath)) {
    return {
      headers: ["slug", "query", "position", "priority", "status", "notes"],
      rows: [],
    };
  }
  return parseCsv(readFileSync(queuePath, "utf8"));
}

function buildKeywordIndex() {
  const index = new Map();
  for (const article of loadPublishedArticles()) {
    if (article.draft || !article.fields?.keyword) {
      continue;
    }
    index.set(normalizeQuery(article.fields.keyword), article.slug);
  }
  return index;
}

function resolveSlug(query, keywordIndex) {
  const normalized = normalizeQuery(query);
  if (keywordIndex.has(normalized)) {
    return keywordIndex.get(normalized);
  }
  for (const [keyword, slug] of keywordIndex.entries()) {
    if (normalized.includes(keyword) || keyword.includes(normalized)) {
      return slug;
    }
  }
  return "";
}

function main() {
  if (!csvArg) {
    console.error(
      "Usage: node scripts/gsc-import-rewrite-queue.mjs --csv=data/gsc-performance-YYYYMMDD.csv",
    );
    process.exit(1);
  }

  const csvPath = join(repoRoot, csvArg.slice("--csv=".length));
  if (!existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const { rows: gscRows } = parseCsv(readFileSync(csvPath, "utf8"));
  const keywordIndex = buildKeywordIndex();
  const queue = loadQueue();
  const existingQueries = new Set(
    queue.rows.map((row) => normalizeQuery(row.query)).filter(Boolean),
  );

  const candidates = [];
  for (const row of gscRows) {
    const query = pickField(row, ["Query", "query", "Top queries", "クエリ"]);
    const positionRaw = pickField(row, [
      "Position",
      "position",
      "Average position",
      "掲載順位",
    ]);
    const position = Number.parseFloat(positionRaw);
    if (!query || Number.isNaN(position)) {
      continue;
    }
    if (position < minPosition || position > maxPosition) {
      continue;
    }
    if (existingQueries.has(normalizeQuery(query))) {
      continue;
    }

    const slug = resolveSlug(query, keywordIndex);
    candidates.push({
      slug,
      query,
      position: position.toFixed(1),
      priority: String(candidates.length + 1),
      status: "pending",
      notes: slug ? "GSC 11-30位" : "GSC 11-30位（slug要確認）",
    });
  }

  candidates.sort(
    (a, b) => Number.parseFloat(a.position) - Number.parseFloat(b.position),
  );
  candidates.forEach((row, index) => {
    row.priority = String(index + 1);
  });

  if (candidates.length === 0) {
    console.log(`gsc-import: no new rows in position ${minPosition}-${maxPosition}`);
    process.exit(0);
  }

  const merged = [...queue.rows, ...candidates];
  console.log(
    `gsc-import: ${candidates.length} new row(s) (${candidates.filter((r) => r.slug).length} slug matched)`,
  );
  for (const row of candidates.slice(0, 10)) {
    console.log(`  - ${row.query} (pos ${row.position}) → ${row.slug || "?"}`);
  }
  if (candidates.length > 10) {
    console.log(`  ... and ${candidates.length - 10} more`);
  }

  if (dryRun) {
    console.log("dry-run: rewrite-queue.csv not written");
    process.exit(0);
  }

  writeFileSync(queuePath, serializeCsv(queue.headers, merged), "utf8");
  console.log(`Wrote ${queuePath}`);
}

main();
