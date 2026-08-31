/**
 * Import GSC Search Analytics CSV → rewrite-queue.csv (position 11–30).
 *
 * Usage:
 *   node scripts/gsc-import-rewrite-queue.mjs --csv=data/gsc-performance-YYYYMMDD.csv
 *   node scripts/gsc-import-rewrite-queue.mjs --csv=data/gsc-pages-YYYYMMDD.csv
 *   node scripts/gsc-import-rewrite-queue.mjs --csv=... --dry-run
 *   node scripts/gsc-import-rewrite-queue.mjs --csv=... --min-position=11 --max-position=30
 *
 * Accepts Query CSV (keyword match) or Page CSV (/articles/{slug}).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadPublishedArticles, repoRoot } from "./e2e/e2e-utils.mjs";
import {
  collectCandidates,
  parseCsv,
  serializeCsv,
} from "./gsc/import-rewrite-queue.mjs";

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

function loadQueue() {
  if (!existsSync(queuePath)) {
    return {
      headers: ["slug", "query", "position", "priority", "status", "notes"],
      rows: [],
    };
  }
  return parseCsv(readFileSync(queuePath, "utf8"));
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
  const queue = loadQueue();
  const candidates = collectCandidates({
    gscRows,
    queueRows: queue.rows,
    articles: loadPublishedArticles(),
    minPosition,
    maxPosition,
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
