#!/usr/bin/env node
/**
 * Plan the next affiliate sync cycle (pending programs, stale lastVerified, health alerts).
 *
 * Usage:
 *   node scripts/affiliate/plan-sync-cycle.mjs
 *   node scripts/affiliate/plan-sync-cycle.mjs --dry-run
 */
import { pathToFileURL } from "node:url";
import {
  AFFILIATE_PATHS,
  buildLastVerifiedAlert,
  DEFAULT_LAST_VERIFIED_ALERT_DAYS,
  readAspUrls,
  readJson,
  todayIsoDate,
  writeJson,
} from "./lib.mjs";

const MAX_TASKS_PER_CYCLE = 3;

/**
 * @param {object} registry
 * @param {object|null} healthReport
 * @param {{ alertDays?: number, referenceDate?: string }} [options]
 */
export function collectSyncTargets(registry, healthReport, options = {}) {
  const alertDays = options.alertDays ?? DEFAULT_LAST_VERIFIED_ALERT_DAYS;
  const referenceDate = options.referenceDate ?? todayIsoDate();
  const targets = [];
  const seen = new Set();

  function addTarget(target) {
    if (seen.has(target.programKey)) return;
    seen.add(target.programKey);
    targets.push(target);
  }

  for (const [programKey, program] of Object.entries(registry.programs ?? {})) {
    const providerKey = program.provider;
    const isAspProvider = providerKey === "a8" || providerKey === "valuecommerce";
    if (program.status === "pending" && !program.trackingUrl && isAspProvider) {
      addTarget({
        programKey,
        label: program.label ?? programKey,
        provider: program.provider,
        reason: "pending-without-trackingUrl",
        priority: 100,
        portalUrl: registry.providers?.[program.provider]?.portal?.management ?? null,
      });
    }
  }

  for (const alert of healthReport?.alerts ?? []) {
    if (!alert.programKey) continue;
    const program = registry.programs?.[alert.programKey];
    if (!program) continue;

    const priority =
      alert.type === "probe-failed" ? 80 : alert.type === "stale-lastVerified" ? 60 : 40;

    addTarget({
      programKey: alert.programKey,
      label: program.label ?? alert.programKey,
      provider: program.provider,
      reason: alert.type,
      priority,
      message: alert.message,
      portalUrl: registry.providers?.[program.provider]?.portal?.management ?? null,
    });
  }

  for (const [programKey, program] of Object.entries(registry.programs ?? {})) {
    const staleAlert = buildLastVerifiedAlert(program, programKey, alertDays);
    if (staleAlert && !seen.has(programKey)) {
      addTarget({
        programKey,
        label: program.label ?? programKey,
        provider: program.provider,
        reason: staleAlert.type,
        priority: 50,
        message: staleAlert.message,
        portalUrl: registry.providers?.[program.provider]?.portal?.management ?? null,
      });
    }
  }

  return targets.sort((a, b) => b.priority - a.priority);
}

/**
 * @param {object[]} tasks
 * @param {object} registry
 */
export function buildUserChecklist(tasks, registry) {
  const lines = [
    "### ユーザー手動チェックリスト（ASP ログイン必須）",
    "",
    "Agent は A8 / バリューコマースへ **ログインできません**。以下をユーザーが実施してください。",
    "",
  ];

  for (const task of tasks) {
    const providerName =
      registry.providers?.[task.provider]?.displayName ?? task.provider ?? "ASP";
    lines.push(`#### ${task.label} (\`${task.programKey}\`)`);
    lines.push(`- [ ] [${providerName} 管理画面](${task.portalUrl ?? "#"}) にログイン`);
    lines.push("- [ ] トラッキングリンク生成画面から URL をコピー（推測・生成禁止）");
    lines.push("- [ ] 下記テンプレートまたは Issue コメントに貼り付け");
    lines.push("");
  }

  lines.push(
    "貼り付け例:",
    "",
    "```",
    "npm run affiliate:parse -- --text '<paste here>'",
    "```",
    "",
    "解析後、programKey を付けて intake:",
    "",
    "```bash",
    "npm run affiliate:intake:dry-run -- <programKey>  # JSON stdin",
    "npm run affiliate:intake -- <programKey>",
    "```",
  );

  return lines.join("\n");
}

/**
 * @param {object} brief
 */
export function buildAffiliateAgentPrompt(brief) {
  const programList = brief.tasks
    .map((task) => `- \`${task.programKey}\` (${task.reason}): ${task.label}`)
    .join("\n");

  return [
    `## Affiliate Sync Cycle ${brief.cycleNumber}`,
    "",
    "### 制約",
    "- A8 / バリューコマース / もしもへの **自動ログイン禁止**",
    "- tracking URL の **推測・生成禁止**（ユーザー提供のみ）",
    "- 変更は `config/asp-urls.json` の intake 経由のみ。registry 変更は PR 必須",
    "",
    "### 対象プログラム",
    programList,
    "",
    "### Agent 作業",
    "1. ユーザーが Issue に貼った ASP ペーストを `npm run affiliate:parse` で解析",
    "2. `npm run affiliate:intake:dry-run` で検証",
    "3. 問題なければ intake 適用 → ブランチ `feature/affiliate-sync-" +
      brief.cycleNumber +
      "` → PR 作成",
    "4. `npm run test:affiliate` と `npm run affiliate:health:dry-run` を実行",
    "",
    "### 受け入れ条件",
    "- intake 検証エラーなし",
    "- test:affiliate パス",
    "- PR に変更理由と programKey を明記",
  ].join("\n");
}

/**
 * @param {object} state
 * @param {object} registry
 * @param {object|null} healthReport
 * @param {{ alertDays?: number, referenceDate?: string }} [options]
 */
export function planAffiliateSync(state, registry, healthReport, options = {}) {
  if (state.paused) {
    return { action: "skip", reason: "Affiliate sync paused", state };
  }

  if (state.consecutiveFailures >= 3) {
    state.paused = true;
    state.blockers = [
      ...(state.blockers ?? []),
      "3 consecutive affiliate sync failures — manual review required",
    ];
    return { action: "pause", reason: "consecutiveFailures >= 3", state };
  }

  const targets = collectSyncTargets(registry, healthReport, options);
  if (targets.length === 0) {
    return {
      action: "skip",
      reason: "No pending programs or health alerts",
      state,
      metrics: {
        pendingCount: 0,
        alertCount: healthReport?.summary?.alertCount ?? 0,
      },
    };
  }

  const tasks = targets.slice(0, MAX_TASKS_PER_CYCLE);
  const brief = {
    cycleNumber: state.cycleNumber,
    tasks,
    metrics: {
      pendingPrograms: targets.filter((t) => t.reason === "pending-without-trackingUrl")
        .length,
      healthAlerts: healthReport?.summary?.alertCount ?? 0,
      totalTargets: targets.length,
    },
    userChecklist: "",
    agentPrompt: "",
    createdAt: new Date().toISOString(),
  };

  brief.userChecklist = buildUserChecklist(tasks, registry);
  brief.agentPrompt = buildAffiliateAgentPrompt(brief);

  state.lastOutcome = "planned";
  state.metrics = brief.metrics;

  return { action: "plan", brief, state, targets };
}

const dryRun = process.argv.includes("--dry-run");

function main() {
  const state = readJson(AFFILIATE_PATHS.state, {
    cycleNumber: 1,
    consecutiveFailures: 0,
    paused: false,
    blockers: [],
  });
  const registry = readAspUrls();
  const healthReport = readJson(AFFILIATE_PATHS.healthReport, null);

  const result = planAffiliateSync(state, registry, healthReport);
  console.log(JSON.stringify({ action: result.action, reason: result.reason ?? null }));

  if (result.action === "skip" || result.action === "pause") {
    if (!dryRun) writeJson(AFFILIATE_PATHS.state, result.state);
    process.exit(result.action === "pause" ? 2 : 0);
  }

  if (dryRun) {
    console.log(JSON.stringify(result.brief, null, 2));
    return;
  }

  writeJson(AFFILIATE_PATHS.brief, result.brief);
  writeJson(AFFILIATE_PATHS.state, {
    ...result.state,
    lastRunAt: new Date().toISOString(),
    lastProgramKeys: result.brief.tasks.map((task) => task.programKey),
  });

  console.log(
    `Planned Affiliate Sync Cycle ${result.brief.cycleNumber}: ${result.brief.tasks.map((t) => t.programKey).join(", ")}`,
  );
  console.log(`Brief: ${AFFILIATE_PATHS.brief}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
