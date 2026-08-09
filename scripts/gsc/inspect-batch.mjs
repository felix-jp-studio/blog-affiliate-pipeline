/**
 * Daily GSC inspect batch: UI indexing request + URL Inspection API + queue update.
 *
 * Usage:
 *   node scripts/gsc/inspect-batch.mjs
 *   node scripts/gsc/inspect-batch.mjs --dry-run
 *   node scripts/gsc/inspect-batch.mjs --week-first --limit=10
 *   node scripts/gsc/inspect-batch.mjs --api-only
 *   node scripts/gsc/inspect-batch.mjs --write-note --commit
 *
 * Env:
 *   GSC_SERVICE_ACCOUNT_JSON or GSC_OAUTH_*  — API (required for inspect)
 *   GSC_PLAYWRIGHT_STORAGE_STATE             — base64 JSON for UI requests
 *   GSC_SITE_URL                             — property URL with trailing /
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { hasApiCredentials, getAccessToken, siteUrlFromEnv } from "./auth.mjs";
import { inspectUrlWithFallback } from "./inspect-url.mjs";
import { hasPlaywrightStorage } from "./playwright-storage.mjs";
import { requestIndexingBatchViaUi } from "./request-index-ui.mjs";
import {
  loadQueue,
  writeQueue,
  queueStats,
  loadPending,
  patchQueueEntry,
  todayJstDate,
} from "./queue.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const apiOnly = args.includes("--api-only");
const uiOnly = args.includes("--ui-only");
const weekFirst = args.includes("--week-first");
const autoMark = !args.includes("--no-auto-mark-indexed");
const shouldCommit = args.includes("--commit");
const writeNoteArg = args.find(
  (arg) => arg === "--write-note" || arg.startsWith("--write-note="),
);

const limitArg = args.find((arg) => arg.startsWith("--limit="));
const offsetArg = args.find((arg) => arg.startsWith("--offset="));
const parsedLimit = limitArg
  ? Number.parseInt(limitArg.slice("--limit=".length), 10)
  : 10;
const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
const parsedOffset = offsetArg
  ? Number.parseInt(offsetArg.slice("--offset=".length), 10)
  : 0;
const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveWriteNotePath() {
  if (!writeNoteArg) {
    return null;
  }
  if (writeNoteArg === "--write-note") {
    return join(repoRoot, `docs/operations/gsc-inspect-run-${todayJstDate()}.md`);
  }
  return join(repoRoot, writeNoteArg.slice("--write-note=".length));
}

function renderReport({ stats, batch, results, mode, pendingCount }) {
  const lines = [
    `# GSC 検査バッチ実行ログ（${todayJstDate()}）`,
    "",
    "> 自動生成 — `scripts/gsc/inspect-batch.mjs`",
    "",
    "| 項目 | 値 |",
    "| --- | --- |",
    `| モード | ${mode} |`,
    `| プロパティ | \`${siteUrlFromEnv()}\` |`,
    `| キュー合計 | ${stats.total} |`,
    `| pending | ${stats.pending} |`,
    `| indexed | ${stats.indexed} |`,
    `| 今回バッチ | ${batch.length} / ${pendingCount}${offset > 0 ? ` (offset ${offset})` : ""} |`,
    `| 生成日時 (UTC) | ${new Date().toISOString()} |`,
    "",
    "## 結果",
    "",
    "| # | slug | UI | API verdict | indexed | 備考 |",
    "| -: | --- | --- | --- | :---: | --- |",
  ];

  for (const [index, item] of results.entries()) {
    lines.push(
      `| ${index + 1} | ${item.slug} | ${item.uiStatus ?? "—"} | ${item.inspection?.verdict ?? "—"} | ${item.indexed ? "✅" : "⏳"} | ${item.note ?? ""} |`,
    );
  }

  lines.push(
    "",
    "## コマンド",
    "",
    "```bash",
    "npm run gsc:inspect-batch -- --week-first --limit=10",
    "npm run gsc:auth:login",
    "```",
    "",
  );

  return `${lines.join("\n")}\n`;
}

function formatMarkdownNote(notePath) {
  try {
    execFileSync("npx", ["prettier", "--write", notePath], {
      cwd: repoRoot,
      stdio: "pipe",
    });
  } catch (error) {
    console.warn(
      `gsc-inspect-batch: prettier failed on ops note — ${error instanceof Error ? error.message : error}`,
    );
  }
}

function applyResultToEntry(entry, { uiResult, apiResult, nowIso }) {
  const patch = {
    lastInspectedAt: nowIso,
    inspection: apiResult?.inspection ?? entry.inspection ?? null,
  };

  if (uiResult?.status === "requested") {
    patch.indexRequestedAt = nowIso;
  }

  if (autoMark && apiResult?.inspection?.indexed) {
    patch.indexed = true;
    patch.indexedAt = nowIso;
  }

  return patch;
}

async function main() {
  const queue = loadQueue();
  const stats = queueStats(queue.entries);
  const pending = loadPending(queue.entries, { weekFirst });
  const batch = pending.slice(offset, offset + limit);

  if (batch.length === 0) {
    console.log("gsc-inspect-batch: no pending URLs — nothing to do (exit 0)");
    return 0;
  }

  const hasApi = hasApiCredentials();
  const hasUi = hasPlaywrightStorage();

  if (!hasApi && !dryRun) {
    console.log(
      [
        "gsc-inspect-batch: GSC API credentials missing — skip (exit 0).",
        "Set GSC_SERVICE_ACCOUNT_JSON or GSC_OAUTH_* in GitHub Secrets.",
        "See docs/gsc-inspect-automation.md",
      ].join("\n"),
    );
    return 0;
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          stats,
          batch: batch.map(({ slug, url }) => ({ slug, url })),
          hasApi,
          hasUi,
          apiOnly,
          uiOnly,
        },
        null,
        2,
      ),
    );
    return 0;
  }

  const nowIso = new Date().toISOString();
  const results = [];
  let accessToken = null;

  if (hasApi && !uiOnly) {
    accessToken = await getAccessToken();
  }

  let uiResultsByUrl = new Map();
  if (hasUi && !apiOnly) {
    try {
      const uiResults = await requestIndexingBatchViaUi(
        batch.map((entry) => entry.url),
        { siteUrl: siteUrlFromEnv() },
      );
      uiResultsByUrl = new Map(uiResults.map((item) => [item.url, item]));
    } catch (error) {
      console.warn(
        `gsc-inspect-batch: UI automation failed — ${error instanceof Error ? error.message : error}`,
      );
      if (!hasApi) {
        throw error;
      }
    }
  } else if (!apiOnly) {
    console.warn(
      "gsc-inspect-batch: Playwright storage missing — skipping UI indexing requests (API-only).",
    );
  }

  for (const entry of batch) {
    const uiResult = uiResultsByUrl.get(entry.url);
    let apiResult = null;
    let note = uiResult?.message ?? "";

    if (accessToken) {
      try {
        apiResult = await inspectUrlWithFallback(accessToken, entry.url, {
          siteUrl: siteUrlFromEnv(),
        });
        await sleep(1200);
      } catch (error) {
        const apiNote = `API error: ${error instanceof Error ? error.message : error}`;
        note = note ? `${note}; ${apiNote}` : apiNote;
      }
    }

    const patch = applyResultToEntry(entry, { uiResult, apiResult, nowIso });
    patchQueueEntry(queue, entry.slug, patch);

    results.push({
      slug: entry.slug,
      url: entry.url,
      uiStatus: uiResult?.status ?? (apiOnly ? "api-only" : "skipped"),
      inspection: apiResult?.inspection ?? null,
      indexed: Boolean(patch.indexed),
      note,
    });
  }

  const mode = [
    hasUi && !apiOnly ? "ui" : null,
    hasApi && !uiOnly ? "api" : null,
    apiOnly ? "api-only" : null,
    uiOnly ? "ui-only" : null,
  ]
    .filter(Boolean)
    .join("+");

  const notePath = resolveWriteNotePath();
  const report = renderReport({
    stats: queueStats(queue.entries),
    batch,
    results,
    mode: mode || "unknown",
    pendingCount: pending.length,
  });

  if (!dryRun) {
    writeQueue(queue);
    console.log(`gsc-inspect-batch: updated queue (${results.length} entries processed)`);
  }

  if (notePath) {
    mkdirSync(dirname(notePath), { recursive: true });
    writeFileSync(notePath, report, "utf8");
    formatMarkdownNote(notePath);
    console.log(`Wrote ops note: ${notePath}`);
  } else {
    process.stdout.write(report);
  }

  if (shouldCommit && !dryRun) {
    const paths = [join(repoRoot, "data/gsc-index-queue.json")];
    if (notePath) {
      paths.push(notePath);
    }
    const relPaths = paths.map((path) =>
      path.startsWith(`${repoRoot}/`) ? path.slice(repoRoot.length + 1) : path,
    );
    execFileSync("git", ["add", ...relPaths], { cwd: repoRoot, stdio: "inherit" });

    let hasStagedChanges = false;
    try {
      execFileSync("git", ["diff", "--cached", "--quiet"], { cwd: repoRoot });
    } catch {
      hasStagedChanges = true;
    }

    if (hasStagedChanges) {
      execFileSync(
        "git",
        [
          "commit",
          "-m",
          `chore(gsc): daily inspect batch ${todayJstDate()} (${results.length} URLs)`,
        ],
        { cwd: repoRoot, stdio: "inherit" },
      );
      console.log("gsc-inspect-batch: committed queue/report changes");
    } else {
      console.log("gsc-inspect-batch: no git changes to commit");
    }
  }

  return 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exit(2);
});
