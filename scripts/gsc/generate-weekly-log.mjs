#!/usr/bin/env node
/**
 * Generate GSC weekly log markdown from agent-managed metrics.
 * GSC dashboard metrics (clicks, impressions) remain User placeholders.
 *
 * Usage:
 *   node scripts/gsc/generate-weekly-log.mjs
 *   node scripts/gsc/generate-weekly-log.mjs --date=2026-08-15
 *   node scripts/gsc/generate-weekly-log.mjs --dry-run
 *   node scripts/gsc/generate-weekly-log.mjs --user-comment="表示0、クリック0、インデックス54"
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";
import { loadQueue, queueStats, todayJstDate } from "./queue.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const dateArg = args.find((arg) => arg.startsWith("--date="));
const commentArg = args.find((arg) => arg.startsWith("--user-comment="));
const logDate = dateArg ? dateArg.slice("--date=".length) : todayJstDate();
const userComment = commentArg ? commentArg.slice("--user-comment=".length) : "";

const DAILY_LIMIT = 10;
const DOMAIN_START = "2026-07-13";

function countPublishedArticles() {
  const dir = join(repoRoot, "site/src/content/articles");
  let count = 0;
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".md"))) {
    const content = readFileSync(join(dir, file), "utf8");
    if (/^draft:\s*true\s*$/m.test(content)) continue;
    count += 1;
  }
  return count;
}

function findLatestInspectRun() {
  const opsDir = join(repoRoot, "docs/operations");
  if (!existsSync(opsDir)) return null;
  const files = readdirSync(opsDir)
    .filter((name) => name.startsWith("gsc-inspect-run-") && name.endsWith(".md"))
    .sort()
    .reverse();
  return files[0] ? `docs/operations/${files[0]}` : null;
}

export function estimateDaysToComplete(pending, dailyLimit = DAILY_LIMIT) {
  if (pending <= 0) return 0;
  return Math.ceil(pending / dailyLimit);
}

export function weekNumberFromDomainStart(dateStr, startDate = DOMAIN_START) {
  const start = new Date(`${startDate}T00:00:00+09:00`);
  const current = new Date(`${dateStr}T00:00:00+09:00`);
  const diffMs = current.getTime() - start.getTime();
  if (diffMs < 0) return 1;
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
}

export function renderWeeklyLog({
  logDate,
  stats,
  articleCount,
  inspectRun,
  userComment: comment = "",
  dailyLimit = DAILY_LIMIT,
}) {
  const week = weekNumberFromDomainStart(logDate);
  const rate =
    stats.total > 0 ? Math.round((stats.indexed / stats.total) * 1000) / 10 : 0;
  const etaDays = estimateDaysToComplete(stats.pending, dailyLimit);

  const commentBlock = comment ? `\n> **User コメント (${logDate})**: ${comment}\n` : "";

  return `# GSC 週次ログ（${logDate} / Week ${week}）

> **User 入力待ち（GSC ダッシュボード）** — サイト全体の表示・クリックは Search Console から共有してください。  
> **Agent 管理** — インデックスキュー・記事数は \`data/gsc-index-queue.json\` から自動集計。

## 記録日

- 記録日: ${logDate}
- 対象期間: 直近 28 日（GSC デフォルト）
- 関連 Issue: [#229](https://github.com/felix-jp-studio/blog-affiliate-pipeline/issues/229)
${commentBlock}
## サイト全体（User 入力）

| 指標         | 値          | 前週比 |
| ------------ | ----------- | ------ |
| クリック数   | _User 入力_ | —      |
| 表示回数     | _User 入力_ | —      |
| CTR          | _User 入力_ | —      |
| 平均掲載順位 | _User 入力_ | —      |

## インデックス状況（Agent 管理キュー）

| 項目         | 値                                              |
| ------------ | ----------------------------------------------- |
| キュー合計   | ${stats.total}                                  |
| indexed      | ${stats.indexed}（${rate}%）                    |
| pending      | ${stats.pending}                                |
| 消化 ETA     | 約 ${etaDays} 日（${dailyLimit} URL/日）        |
| 最新検査ログ | \`${inspectRun ?? "—"}\`                        |

## 記事・供給（Agent）

| 項目       | 値             |
| ---------- | -------------- |
| 公開記事数 | ${articleCount} |
| orphan     | \`npm run audit:orphans\` |
| hub mesh   | \`npm run audit:hub-mesh\` |

## 上位クエリ TOP5（クリック順）

1. _User 入力_
2. _User 入力_
3. _User 入力_
4. _User 入力_
5. _User 入力_

## 所感・次アクション

- [ ] GSC 28 日 CSV → \`data/gsc-performance-YYYYMMDD.csv\` → \`npm run gsc:import-rewrite-queue\`
- [ ] pending ${stats.pending} 本 — 日次 \`gsc-inspect-daily\` で消化（ETA 約 ${etaDays} 日）
- [ ] GSC / IndexNow secrets 未設定分 → [issue-229-secrets-checklist.md](./issue-229-secrets-checklist.md)
- [ ] Visitability PDCA — \`npm run visitability:metrics -- --update-state\`

## 再生成コマンド

\`\`\`bash
npm run gsc:weekly-log
npm run gsc:weekly-log -- --date=${logDate}
npm run gsc:index-queue-status
npm run gsc:inspection-batch -- --format=md --limit=10
\`\`\`
`;
}

function main() {
  const queue = loadQueue();
  const stats = queueStats(queue.entries);
  const articleCount = countPublishedArticles();
  const inspectRun = findLatestInspectRun();
  const content = renderWeeklyLog({
    logDate,
    stats,
    articleCount,
    inspectRun,
    userComment,
  });

  const outPath = join(repoRoot, `docs/operations/gsc-weekly-log-${logDate}.md`);

  if (dryRun) {
    process.stdout.write(content);
    return;
  }

  writeFileSync(outPath, content, "utf8");
  console.log(`Wrote ${outPath}`);
  console.log(
    `Queue: ${stats.indexed}/${stats.total} indexed (${stats.pending} pending, ETA ~${estimateDaysToComplete(stats.pending)} days)`,
  );
}

const isDirectRun = process.argv[1]?.endsWith("generate-weekly-log.mjs");
if (isDirectRun) {
  main();
}
