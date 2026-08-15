#!/usr/bin/env node
/**
 * Print GSC index queue completion status and ETA.
 *
 * Usage:
 *   node scripts/gsc/index-queue-status.mjs
 *   node scripts/gsc/index-queue-status.mjs --json
 *   node scripts/gsc/index-queue-status.mjs --daily-limit=10
 */
import { loadQueue, queueStats } from "./queue.mjs";
import { estimateDaysToComplete } from "./generate-weekly-log.mjs";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const limitArg = args.find((arg) => arg.startsWith("--daily-limit="));
const dailyLimit = limitArg
  ? Number.parseInt(limitArg.slice("--daily-limit=".length), 10)
  : 10;

function main() {
  const queue = loadQueue();
  const stats = queueStats(queue.entries);
  const rate = stats.total > 0 ? stats.indexed / stats.total : 0;
  const etaDays = estimateDaysToComplete(stats.pending, dailyLimit);
  const complete = stats.pending === 0;

  const status = {
    updatedAt: queue.updatedAt ?? null,
    total: stats.total,
    indexed: stats.indexed,
    pending: stats.pending,
    rate: Math.round(rate * 1000) / 1000,
    ratePercent: Math.round(rate * 1000) / 10,
    dailyLimit,
    etaDays,
    complete,
  };

  if (asJson) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  console.log(`GSC index queue (${status.updatedAt ?? "unknown"})`);
  console.log(`  indexed: ${status.indexed}/${status.total} (${status.ratePercent}%)`);
  console.log(`  pending: ${status.pending}`);
  if (complete) {
    console.log("  status: COMPLETE — all URLs indexed in queue");
  } else {
    console.log(`  ETA: ~${etaDays} days at ${dailyLimit} URLs/day`);
  }
}

main();
