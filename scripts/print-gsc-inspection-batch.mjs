/**
 * Print pending GSC URL inspection batch from data/gsc-index-queue.json.
 *
 * Usage:
 *   node scripts/print-gsc-inspection-batch.mjs
 *   node scripts/print-gsc-inspection-batch.mjs --limit=7
 *   node scripts/print-gsc-inspection-batch.mjs --json
 *   node scripts/print-gsc-inspection-batch.mjs --format=md
 *   node scripts/print-gsc-inspection-batch.mjs --week-first --limit=10
 *   node scripts/print-gsc-inspection-batch.mjs --offset=10 --limit=10
 *   node scripts/print-gsc-inspection-batch.mjs --write-note[=docs/operations/...]
 *   node scripts/print-gsc-inspection-batch.mjs --mark-indexed=slug-a,slug-b
 *
 * IMPORTANT: Do NOT use --mark-indexed unless the User confirmed each URL is
 * indexed (or an index request was completed) in Google Search Console.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { repoRoot } from "./e2e/e2e-utils.mjs";
import {
  loadPending,
  loadQueue,
  markIndexed,
  queueStats,
  todayJstDate,
  writeQueue,
} from "./gsc/queue.mjs";

const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const offsetArg = args.find((arg) => arg.startsWith("--offset="));
const markIndexedArg = args.find((arg) => arg.startsWith("--mark-indexed="));
const writeNoteArg = args.find(
  (arg) => arg === "--write-note" || arg.startsWith("--write-note="),
);
const asJson = args.includes("--json");
const weekFirst = args.includes("--week-first");
const formatArg = args.find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "text";
const parsedLimit = limitArg
  ? Number.parseInt(limitArg.slice("--limit=".length), 10)
  : 10;
const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
const parsedOffset = offsetArg
  ? Number.parseInt(offsetArg.slice("--offset=".length), 10)
  : 0;
const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

function buildMarkdown({ stats, batch, pendingCount, forOpsNote = false }) {
  const dateLabel = todayJstDate();
  const lines = [
    forOpsNote ? `# GSC URL 検査バッチ（${dateLabel}）` : "## GSC URL 検査バッチ",
    "",
    ...(forOpsNote
      ? [
          "> **Agent prep only** — `indexed: true` は User 確認後のみ更新する。",
          "",
          "## 手順（User）",
          "",
          "1. [Google Search Console](https://search.google.com/search-console) を開く",
          "2. プロパティ `https://sim-hikari-guide.com` を選択",
          "3. 下記 URL を **1 日 5–10 本** 上限で URL 検査 → インデックス登録をリクエスト",
          "4. 完了した slug を Agent に共有（例: `indexed: ahamo-povo-hikaku,au-denki-setwari`）",
          "",
          "## キュー概況",
          "",
        ]
      : []),
    `| 項目 | 値 |`,
    `| --- | --- |`,
    `| キュー合計 | ${stats.total} |`,
    `| pending | ${stats.pending} |`,
    `| indexed | ${stats.indexed} |`,
    `| 今週追加 pending | ${stats.pendingThisWeek} |`,
    `| 今回バッチ | ${batch.length} / ${pendingCount}${offset > 0 ? ` (offset ${offset})` : ""} |`,
    "",
  ];

  if (batch.length === 0) {
    lines.push("_pending なし — 今週の GSC 検査はスキップ可_");
  } else {
    lines.push(
      forOpsNote
        ? "## 本日の検査リスト"
        : "### 検査リスト（GSC → URL 検査 → インデックス登録をリクエスト）",
    );
    lines.push("");
    for (const [index, entry] of batch.entries()) {
      const weekTag = entry.mergedThisWeek ? " 🆕" : "";
      lines.push(
        `${index + 1}. [${entry.slug}](${entry.url}) — merged ${entry.mergedAt.slice(0, 10)}${weekTag}`,
      );
    }
    lines.push("");
    lines.push(
      forOpsNote
        ? "User 確認後のみ: `npm run gsc:inspection-batch -- --mark-indexed=slug1,slug2`"
        : "完了後: `npm run gsc:inspection-batch -- --mark-indexed=slug1,slug2` でキューを更新（**User 確認必須**）",
    );
  }

  if (forOpsNote) {
    lines.push("");
    lines.push("## 再生成コマンド");
    lines.push("");
    lines.push("```bash");
    lines.push("npm run gsc:inspection-batch -- --format=md --limit=10");
    lines.push("npm run gsc:inspection-batch -- --write-note");
    lines.push("```");
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function resolveWriteNotePath() {
  if (!writeNoteArg) {
    return null;
  }
  if (writeNoteArg === "--write-note") {
    return join(repoRoot, `docs/operations/gsc-inspection-batch-${todayJstDate()}.md`);
  }
  const relative = writeNoteArg.slice("--write-note=".length);
  return join(repoRoot, relative);
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
const pending = loadPending(queue.entries, { weekFirst });
const batch = pending.slice(offset, offset + limit);

const notePath = resolveWriteNotePath();
if (notePath) {
  mkdirSync(dirname(notePath), { recursive: true });
  const note = buildMarkdown({
    stats,
    batch,
    pendingCount: pending.length,
    forOpsNote: true,
  });
  writeFileSync(notePath, note, "utf8");
  console.log(`Wrote ops note: ${notePath}`);
}

if (asJson) {
  console.log(JSON.stringify({ stats, pending: pending.length, batch }, null, 2));
  process.exit(0);
}

if (format === "md" || notePath) {
  if (format === "md" || !notePath) {
    process.stdout.write(buildMarkdown({ stats, batch, pendingCount: pending.length }));
  }
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
  "After User confirmation only: npm run gsc:inspection-batch -- --mark-indexed=slug1,slug2",
);
