#!/usr/bin/env node
/**
 * Collect Visitability PDCA metrics for Check phase.
 *
 * Usage:
 *   node scripts/visitability/collect-metrics.mjs
 *   node scripts/visitability/collect-metrics.mjs --json
 *   node scripts/visitability/collect-metrics.mjs --update-state
 */
import {
  PATHS,
  keywordSeedMaxPriority,
  loadArticleCounts,
  loadIndexQueueMetrics,
  loadKeywordSeed,
  loadRewriteQueueCount,
  countOrphanArticles,
  countOpenVisitabilityPrs,
  readJson,
  writeJson,
} from "./lib.mjs";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const updateState = args.includes("--update-state");

function collectMetrics() {
  const articleReport = loadArticleCounts();
  const indexQueue = loadIndexQueueMetrics();
  const seedRows = loadKeywordSeed();
  const rewriteQueueCount = loadRewriteQueueCount();

  return {
    collectedAt: new Date().toISOString(),
    articleCount: articleReport.total,
    indexQueueTotal: indexQueue.total,
    indexQueueIndexed: indexQueue.indexed,
    indexQueueRate: indexQueue.rate,
    indexQueuePending: indexQueue.pending,
    typeCounts: articleReport.counts,
    typeRatio: articleReport.ratios,
    typeRatioGaps: articleReport.gaps,
    keywordSeedMax: keywordSeedMaxPriority(seedRows),
    rewriteQueueCount,
    orphanArticleCount: countOrphanArticles(),
    openVisitabilityPrs: countOpenVisitabilityPrs(),
    gscMetricsSkipped: true,
  };
}

function main() {
  const metrics = collectMetrics();

  if (updateState) {
    const state = readJson(PATHS.state, {
      cycleNumber: 32,
      consecutiveFailures: 0,
      blockers: [],
      paused: false,
    });
    state.metrics = metrics;
    state.lastRunAt = metrics.collectedAt;
    writeJson(PATHS.state, state);
  }

  if (asJson || updateState) {
    console.log(JSON.stringify(metrics, null, 2));
    return;
  }

  console.log(`Visitability metrics (${metrics.collectedAt})`);
  console.log(`Articles: ${metrics.articleCount}`);
  console.log(
    `Index queue: ${metrics.indexQueueIndexed}/${metrics.indexQueueTotal} (${Math.round(metrics.indexQueueRate * 100)}%)`,
  );
  console.log(`Keyword seed max priority: ${metrics.keywordSeedMax}`);
  console.log(`Rewrite queue items: ${metrics.rewriteQueueCount}`);
  for (const type of ["comparison", "howto", "troubleshoot", "crosssell"]) {
    console.log(
      `${type}: ${metrics.typeCounts[type]} (${Math.round(metrics.typeRatio[type] * 1000) / 10}%)`,
    );
  }
}

main();
