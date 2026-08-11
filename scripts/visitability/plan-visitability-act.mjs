#!/usr/bin/env node
/**
 * Plan next Visitability Act (V2 multi-act PDCA).
 *
 * Usage:
 *   node scripts/visitability/plan-visitability-act.mjs
 *   node scripts/visitability/plan-visitability-act.mjs --dry-run
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";
import { planArticleCycle } from "./plan-cycle.mjs";
import {
  PATHS,
  countOpenVisitabilityPrs,
  countOrphanArticles,
  keywordSeedMaxPriority,
  loadArticleCounts,
  loadIndexQueueMetrics,
  loadKeywordSeed,
  loadRewriteQueueCount,
  readJson,
  selectActType,
  writeJson,
} from "./lib.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

function collectPlanningMetrics() {
  const articleReport = loadArticleCounts();
  const indexQueue = loadIndexQueueMetrics();
  return {
    collectedAt: new Date().toISOString(),
    articleCount: articleReport.total,
    indexQueueTotal: indexQueue.total,
    indexQueueIndexed: indexQueue.indexed,
    indexQueueRate: indexQueue.rate,
    indexQueuePending: indexQueue.pending,
    typeRatioGaps: articleReport.gaps,
    rewriteQueueCount: loadRewriteQueueCount(),
    orphanArticleCount: countOrphanArticles(),
    openVisitabilityPrs: countOpenVisitabilityPrs(),
    keywordSeedMax: keywordSeedMaxPriority(loadKeywordSeed()),
  };
}

function planAct() {
  const state = readJson(PATHS.state, {
    cycleNumber: 32,
    consecutiveFailures: 0,
    blockers: [],
    paused: false,
  });

  if (state.paused) {
    return { action: "skip", reason: "paused", state };
  }
  if (state.consecutiveFailures >= 3) {
    state.paused = true;
    return { action: "pause", reason: "consecutiveFailures >= 3", state };
  }

  const metrics = collectPlanningMetrics();
  state.metrics = metrics;

  if (metrics.openVisitabilityPrs > 0) {
    return {
      action: "skip",
      reason: `Open Visitability PRs: ${metrics.openVisitabilityPrs}`,
      state,
      metrics,
    };
  }

  const { actType, reason } = selectActType(metrics, state);

  if (actType === "article_cycle") {
    const articlePlan = planArticleCycle(state);
    if (articlePlan.action !== "plan") {
      return { ...articlePlan, metrics, actType: "article_cycle" };
    }
    const actBrief = {
      cycleNumber: state.cycleNumber,
      actType: "article_cycle",
      reason,
      articleBrief: articlePlan.brief,
      createdAt: new Date().toISOString(),
    };
    state.lastActType = "article_cycle";
    state.lastOutcome = "planned";
    return { action: "plan", actBrief, articleBrief: articlePlan.brief, state, metrics };
  }

  const actBrief = {
    cycleNumber: state.cycleNumber,
    actType,
    reason,
    params:
      actType === "index_push"
        ? { batchSize: 10, weekFirst: true }
        : actType === "internal_link_boost"
          ? { maxSlugs: 5, minInbound: 1 }
          : actType === "rewrite_cycle"
            ? { maxArticles: 1 }
            : {},
    createdAt: new Date().toISOString(),
  };

  state.lastActType = actType;
  state.lastOutcome = "planned";
  return { action: "plan", actBrief, state, metrics };
}

function main() {
  const result = planAct();
  console.log(JSON.stringify({ action: result.action, reason: result.reason ?? null }));

  if (result.action === "skip" || result.action === "pause") {
    if (!dryRun) writeJson(PATHS.state, result.state);
    process.exit(result.action === "pause" ? 2 : 0);
  }

  if (result.action === "escalate") {
    if (!dryRun)
      writeJson(PATHS.state, { ...result.state, lastOutcome: "plan-escalate" });
    process.exit(3);
  }

  if (dryRun) {
    console.log(JSON.stringify(result.actBrief, null, 2));
    return;
  }

  writeJson(PATHS.actBrief, result.actBrief);
  writeJson(PATHS.state, result.state);

  if (result.articleBrief) {
    writeJson(PATHS.brief, result.articleBrief);
    writeJson(
      join(repoRoot, `config/batch-cycle${result.actBrief.cycleNumber}-auto.json`),
      {
        description: `Cycle ${result.actBrief.cycleNumber} — auto PDCA (${result.articleBrief.template})`,
        items: result.articleBrief.items,
      },
    );
  }

  console.log(
    `Planned Visitability Act ${result.actBrief.cycleNumber}: ${result.actBrief.actType} (${result.actBrief.reason})`,
  );
}

main();
