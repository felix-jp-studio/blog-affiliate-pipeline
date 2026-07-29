/**
 * Weekly rewrite queue runner (skeleton).
 *
 * Reads data/rewrite-queue.csv and selects the next pending row.
 * Exits 0 when the queue is empty (no failure).
 *
 * Usage:
 *   node scripts/rewrite-weekly.mjs
 *   node scripts/rewrite-weekly.mjs --dry-run
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./e2e/e2e-utils.mjs";

const queuePath = join(repoRoot, "data/rewrite-queue.csv");
const dryRun = process.argv.includes("--dry-run");

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });
}

function loadPendingRows() {
  if (!existsSync(queuePath)) {
    return [];
  }

  const rows = parseCsv(readFileSync(queuePath, "utf8"));
  return rows
    .filter((row) => {
      const status = (row.status ?? "").toLowerCase();
      return status === "" || status === "pending";
    })
    .sort((a, b) => Number(a.priority || 999) - Number(b.priority || 999));
}

const pending = loadPendingRows();

if (pending.length === 0) {
  console.log("rewrite-weekly: queue empty — nothing to rewrite (exit 0)");
  process.exit(0);
}

const next = pending[0];
console.log(
  `rewrite-weekly: next candidate slug=${next.slug || "<missing>"} query=${next.query || "-"} position=${next.position || "-"}`,
);

if (dryRun) {
  console.log("rewrite-weekly: dry-run — generation skipped (skeleton)");
  process.exit(0);
}

console.log(
  "rewrite-weekly: skeleton mode — article rewrite not implemented yet; awaiting gsc-rewrite-queue-v1 population",
);
process.exit(0);
