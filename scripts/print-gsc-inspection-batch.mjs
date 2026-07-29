/**
 * Print pending GSC URL inspection batch from data/gsc-index-queue.json.
 *
 * Usage:
 *   node scripts/print-gsc-inspection-batch.mjs
 *   node scripts/print-gsc-inspection-batch.mjs --limit=7
 *   node scripts/print-gsc-inspection-batch.mjs --json
 *   node scripts/print-gsc-inspection-batch.mjs --format=md
 *   node scripts/print-gsc-inspection-batch.mjs --week-first --limit=10
 *   node scripts/print-gsc-inspection-batch.mjs --mark-indexed=slug-a,slug-b
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./e2e/e2e-utils.mjs";

const queuePath = join(repoRoot, "data/gsc-index-queue.json");
const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const markIndexedArg = args.find((arg) => arg.startsWith("--mark-indexed="));
const asJson = args.includes("--json");
const weekFirst = args.includes("--week-first");
const formatArg = args.find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "text";
const parsedLimit = limitArg
  ? Number.parseInt(limitArg.slice("--limit=".length), 10)
  : 10;
const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

function loadQueue() {
  if (!existsSync(queuePath)) {
    throw new Error(`queue file not found: ${queuePath}`);
  }

  const queue = JSON.parse(readFileSync(queuePath, "utf8"));
  if (!Array.isArray(queue.entries)) {
    throw new Error("gsc-index-queue.json: entries must be an array");
  }
  return queue;
}

function queueStats(entries) {
  const pending = entries.filter((entry) => entry.indexed === false);
  const indexed = entries.filter((entry) => entry.indexed === true);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const pendingThisWeek = pending.filter(
    (entry) => new Date(entry.mergedAt).getTime() >= weekAgo,
  );
  return {
    total: entries.length,
    pending: pending.length,
    indexed: indexed.length,
    pendingThisWeek: pendingThisWeek.length,
  };
}

function loadPending(entries) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const pending = entries
    .filter((entry) => entry.indexed === false)
    .map((entry) => ({
      ...entry,
      mergedThisWeek: new Date(entry.mergedAt).getTime() >= weekAgo,
    }));

  if (weekFirst) {
    return pending.sort((a, b) => {
      if (a.mergedThisWeek !== b.mergedThisWeek) {
        return a.mergedThisWeek ? -1 : 1;
      }
      return new Date(a.mergedAt) - new Date(b.mergedAt);
    });
  }

  return pending.sort((a, b) => new Date(a.mergedAt) - new Date(b.mergedAt));
}

function writeQueue(queue) {
  queue.updatedAt = new Date().toISOString();
  writeFileSync(queuePath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
}

function markIndexed(queue, slugs) {
  const slugSet = new Set(slugs.map((slug) => slug.trim()).filter(Boolean));
  const now = new Date().toISOString();
  let updated = 0;

  for (const entry of queue.entries) {
    if (slugSet.has(entry.slug) && entry.indexed !== true) {
      entry.indexed = true;
      entry.indexedAt = now;
      updated += 1;
    }
  }

  return updated;
}

const queue = loadQueue();

if (markIndexedArg) {
  const slugs = markIndexedArg.slice("--mark-indexed=".length).split(",");
  const updated = markIndexed(queue, slugs);
  if (updated > 0) {
    writeQueue(queue);
  }
  console.log(
    `gsc-inspection-batch: marked ${updated} slug(s) indexed (${slugs.join(", ")})`,
  );
  process.exit(0);
}

const stats = queueStats(queue.entries);
const pending = loadPending(queue.entries);
const batch = pending.slice(0, limit);

if (asJson) {
  console.log(JSON.stringify({ stats, pending: pending.length, batch }, null, 2));
  process.exit(0);
}

if (format === "md") {
  const lines = [
    "## GSC URL 検査バッチ",
    "",
    `| 項目 | 値 |`,
    `| --- | --- |`,
    `| キュー合計 | ${stats.total} |`,
    `| pending | ${stats.pending} |`,
    `| indexed | ${stats.indexed} |`,
    `| 今週追加 pending | ${stats.pendingThisWeek} |`,
    `| 今回バッチ | ${batch.length} / ${stats.pending} |`,
    "",
  ];

  if (batch.length === 0) {
    lines.push("_pending なし — 今週の GSC 検査はスキップ可_");
  } else {
    lines.push("### 検査リスト（GSC → URL 検査 → インデックス登録をリクエスト）");
    lines.push("");
    for (const [index, entry] of batch.entries()) {
      const weekTag = entry.mergedThisWeek ? " 🆕" : "";
      lines.push(
        `${index + 1}. [${entry.slug}](${entry.url}) — merged ${entry.mergedAt.slice(0, 10)}${weekTag}`,
      );
    }
    lines.push("");
    lines.push(
      "完了後: `npm run gsc:inspection-batch -- --mark-indexed=slug1,slug2` でキューを更新",
    );
  }

  console.log(lines.join("\n"));
  process.exit(0);
}

console.log(
  `GSC inspection batch (${batch.length} of ${pending.length} pending, ${stats.pendingThisWeek} merged this week)\n`,
);

if (batch.length === 0) {
  console.log("No pending URLs. Skip GSC inspection this week.");
  process.exit(0);
}

for (const [index, entry] of batch.entries()) {
  const weekTag = entry.mergedThisWeek ? " [this week]" : "";
  console.log(`${index + 1}. ${entry.url}`);
  console.log(`   slug: ${entry.slug}  merged: ${entry.mergedAt.slice(0, 10)}${weekTag}`);
}

console.log("\nCopy each URL into GSC → URL 検査 → インデックス登録をリクエスト");
console.log(
  "After inspection: npm run gsc:inspection-batch -- --mark-indexed=slug1,slug2",
);
