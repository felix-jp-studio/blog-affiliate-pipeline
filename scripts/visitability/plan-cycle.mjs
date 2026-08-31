#!/usr/bin/env node
/**
 * Plan the next Visitability Cycle (Plan phase).
 *
 * Usage:
 *   node scripts/visitability/plan-cycle.mjs
 *   node scripts/visitability/plan-cycle.mjs --dry-run
 */
import {
  PATHS,
  appendKeywordRows,
  buildCycleBatch,
  buildItems,
  buildKeywordAppend,
  cycleBatchPath,
  keywordSeedMaxPriority,
  loadArticleCounts,
  loadIndexQueueMetrics,
  loadKeywordSeed,
  loadRewriteQueueCount,
  loadUsedKeywords,
  readJson,
  selectTemplate,
  writeJson,
} from "./lib.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

function planCycle() {
  const state = readJson(PATHS.state, {
    cycleNumber: 32,
    consecutiveFailures: 0,
    blockers: [],
    paused: false,
  });

  if (state.paused) {
    return {
      action: "skip",
      reason: "PDCA paused (consecutiveFailures or manual pause)",
      state,
    };
  }

  if (state.consecutiveFailures >= 3) {
    state.paused = true;
    state.blockers = [
      ...(state.blockers ?? []),
      "3 consecutive cycle failures — manual review required",
    ];
    return {
      action: "pause",
      reason: "consecutiveFailures >= 3",
      state,
    };
  }

  const articleReport = loadArticleCounts();
  const indexQueue = loadIndexQueueMetrics();
  const seedRows = loadKeywordSeed();
  const usedKeywords = loadUsedKeywords();
  const rewriteQueueCount = loadRewriteQueueCount();

  const metrics = {
    collectedAt: new Date().toISOString(),
    articleCount: articleReport.total,
    indexQueueTotal: indexQueue.total,
    indexQueueIndexed: indexQueue.indexed,
    indexQueueRate: indexQueue.rate,
    typeRatio: articleReport.ratios,
    typeRatioGaps: articleReport.gaps,
    keywordSeedMax: keywordSeedMaxPriority(seedRows),
    rewriteQueueCount,
  };

  if (indexQueue.rate < 0.3 && indexQueue.total >= 20) {
    const slowTemplate = "single_article";
    const startPriority = metrics.keywordSeedMax;
    const slowItems = buildItems(
      slowTemplate,
      seedRows,
      new Set(usedKeywords),
      startPriority,
    );
    if (!slowItems.ok) {
      return { action: "escalate", reason: slowItems.reason, metrics, state };
    }

    const brief = {
      cycleNumber: state.cycleNumber,
      template: slowTemplate,
      throttle: "index-queue-low",
      items: slowItems.items,
      keywordAppend: [],
      keywordRange: [startPriority + 1, startPriority + slowItems.items.length],
      hubMeshUpdates: true,
      fallbackKeywords: [],
      createdAt: new Date().toISOString(),
    };

    state.metrics = metrics;
    state.nextCycleTemplate = slowTemplate;
    state.lastOutcome = "planned-throttled";
    return { action: "plan", brief, state, metrics };
  }

  const template = selectTemplate(metrics, state);
  const startPriority = metrics.keywordSeedMax;
  const keywordAppend = buildKeywordAppend(
    seedRows,
    new Set(usedKeywords),
    startPriority,
  );
  const itemResult = buildItems(
    template,
    appendKeywordRows(seedRows, keywordAppend),
    new Set([...usedKeywords, ...keywordAppend.map((row) => row.keyword)]),
    startPriority + keywordAppend.length,
  );

  if (!itemResult.ok) {
    return {
      action: "escalate",
      reason: itemResult.reason,
      metrics,
      state,
      template,
    };
  }

  const brief = {
    cycleNumber: state.cycleNumber,
    template,
    items: itemResult.items,
    keywordAppend,
    keywordRange: [
      startPriority + 1,
      startPriority + keywordAppend.length + itemResult.items.length,
    ],
    hubMeshUpdates: true,
    fallbackKeywords: keywordAppend.slice(0, 5).map((row) => row.keyword),
    createdAt: new Date().toISOString(),
  };

  if (rewriteQueueCount === 0) {
    brief.rewriteQueueEmpty = true;
  }

  state.metrics = metrics;
  state.nextCycleTemplate = template;
  state.lastOutcome = "planned";
  return { action: "plan", brief, state, metrics };
}

function main() {
  const result = planCycle();
  console.log(
    JSON.stringify({ action: result.action, reason: result.reason ?? null }, null, 0),
  );

  if (result.action === "skip" || result.action === "pause") {
    if (!dryRun) {
      writeJson(PATHS.state, result.state);
    }
    process.exit(result.action === "pause" ? 2 : 0);
  }

  if (result.action === "escalate") {
    if (!dryRun) {
      writeJson(PATHS.state, {
        ...result.state,
        lastOutcome: "plan-escalate",
        blockers: [...(result.state.blockers ?? []), result.reason],
      });
    }
    console.error(`Plan escalation required: ${result.reason}`);
    process.exit(3);
  }

  if (dryRun) {
    console.log(JSON.stringify(result.brief, null, 2));
    return;
  }

  writeJson(PATHS.brief, result.brief);
  writeJson(PATHS.state, result.state);

  const batchPath = cycleBatchPath(result.brief.cycleNumber);
  writeJson(batchPath, buildCycleBatch(result.brief));

  console.log(`Planned Cycle ${result.brief.cycleNumber}: ${result.brief.template}`);
  console.log(`Brief: ${PATHS.brief}`);
  console.log(`Batch: ${batchPath}`);
}

main();
