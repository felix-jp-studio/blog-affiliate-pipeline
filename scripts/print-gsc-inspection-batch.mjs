/**
 * Print pending GSC URL inspection batch from data/gsc-index-queue.json.
 *
 * Usage:
 *   node scripts/print-gsc-inspection-batch.mjs
 *   node scripts/print-gsc-inspection-batch.mjs --limit=7
 *   node scripts/print-gsc-inspection-batch.mjs --json
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./e2e/e2e-utils.mjs";

const queuePath = join(repoRoot, "data/gsc-index-queue.json");
const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const asJson = args.includes("--json");
const parsedLimit = limitArg ? Number.parseInt(limitArg.slice("--limit=".length), 10) : 10;
const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

function loadPending() {
  if (!existsSync(queuePath)) {
    throw new Error(`queue file not found: ${queuePath}`);
  }

  const queue = JSON.parse(readFileSync(queuePath, "utf8"));
  if (!Array.isArray(queue.entries)) {
    throw new Error("gsc-index-queue.json: entries must be an array");
  }

  return queue.entries
    .filter((entry) => entry.indexed === false)
    .sort((a, b) => new Date(a.mergedAt) - new Date(b.mergedAt));
}

const pending = loadPending();
const batch = pending.slice(0, limit);

if (asJson) {
  console.log(JSON.stringify({ pending: pending.length, batch }, null, 2));
  process.exit(0);
}

console.log(
  `GSC inspection batch (${batch.length} of ${pending.length} pending, oldest first)\n`,
);

if (batch.length === 0) {
  console.log("No pending URLs. Skip GSC inspection this week.");
  process.exit(0);
}

for (const [index, entry] of batch.entries()) {
  console.log(`${index + 1}. ${entry.url}`);
  console.log(`   slug: ${entry.slug}  merged: ${entry.mergedAt.slice(0, 10)}`);
}

console.log("\nCopy each URL into GSC → URL 検査 → インデックス登録をリクエスト");
