/**
 * GSC Search Analytics → weekly Markdown report (skeleton).
 *
 * Credentials (set in GitHub Actions secrets / .env.local — do NOT commit):
 *   GSC_SITE_URL                 e.g. https://sim-hikari-guide.com/
 *   GSC_SERVICE_ACCOUNT_JSON     raw JSON string for a Search Console SA
 *   — or OAuth —
 *   GSC_OAUTH_CLIENT_ID
 *   GSC_OAUTH_CLIENT_SECRET
 *   GSC_OAUTH_REFRESH_TOKEN
 *
 * Usage:
 *   node scripts/gsc-weekly-report.mjs
 *   node scripts/gsc-weekly-report.mjs --dry-run
 *   node scripts/gsc-weekly-report.mjs --fixture
 *   node scripts/gsc-weekly-report.mjs --out=docs/operations/gsc-weekly-YYYYMMDD.md
 *
 * Exit 0 when secrets are missing (scheduled runs skip gracefully).
 * Exit 0 when --fixture generates a sample report.
 * Exit 2 only on unexpected runtime errors after credentials are present.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { repoRoot } from "./e2e/e2e-utils.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const useFixture = args.includes("--fixture");
const outArg = args.find((a) => a.startsWith("--out="));

const SITE_URL = process.env.GSC_SITE_URL?.trim() || "https://sim-hikari-guide.com/";

function hasServiceAccount() {
  return Boolean(process.env.GSC_SERVICE_ACCOUNT_JSON?.trim());
}

function hasOAuth() {
  return Boolean(
    process.env.GSC_OAUTH_CLIENT_ID?.trim() &&
    process.env.GSC_OAUTH_CLIENT_SECRET?.trim() &&
    process.env.GSC_OAUTH_REFRESH_TOKEN?.trim(),
  );
}

function hasCredentials() {
  return hasServiceAccount() || hasOAuth();
}

function weekRange(now = new Date()) {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 3),
  );
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

function fixtureRows() {
  return [
    {
      query: "格安sim おすすめ",
      clicks: 12,
      impressions: 400,
      ctr: 0.03,
      position: 18.2,
    },
    {
      query: "nuro光 料金",
      clicks: 5,
      impressions: 220,
      ctr: 0.0227,
      position: 24.1,
    },
    {
      query: "auひかり マンション",
      clicks: 3,
      impressions: 150,
      ctr: 0.02,
      position: 15.5,
    },
  ];
}

/**
 * Placeholder for Search Console API searchanalytics.query.
 * Real JWT / OAuth token exchange is intentionally not implemented here —
 * wire credentials when User provisions SA or OAuth secrets.
 */
async function fetchSearchAnalytics(_credsHint) {
  throw new Error(
    "GSC API client not wired yet. Secrets are present but API call is skeleton-only. Use --fixture until implementation lands.",
  );
}

function renderMarkdown({ siteUrl, startDate, endDate, rows, mode, note }) {
  const lines = [
    `# GSC 週次レポート（${startDate}〜${endDate}）`,
    "",
    `- プロパティ: \`${siteUrl}\``,
    `- 生成モード: \`${mode}\``,
    `- 生成日時 (UTC): ${new Date().toISOString()}`,
    "",
  ];
  if (note) {
    lines.push(`> ${note}`, "");
  }
  lines.push(
    "| クエリ | クリック | 表示 | CTR | 平均順位 |",
    "| ------ | -------: | ---: | --: | -------: |",
  );
  for (const row of rows) {
    const ctrPct = `${(row.ctr * 100).toFixed(2)}%`;
    lines.push(
      `| ${row.query} | ${row.clicks} | ${row.impressions} | ${ctrPct} | ${row.position.toFixed(1)} |`,
    );
  }
  lines.push(
    "",
    "## 次アクション",
    "",
    "- 11–30 位クエリを `data/rewrite-queue.csv` 候補に検討（`gsc-rewrite-queue-v1`）",
    "- 手動ベースライン: `blog-affiliate-auto/docs/operations/gsc-baseline.md`",
    "",
  );
  return `${lines.join("\n")}\n`;
}

function defaultOutPath(endDate) {
  const stamp = endDate.replaceAll("-", "");
  return join(repoRoot, "docs", "gsc-weekly", `gsc-weekly-${stamp}.md`);
}

async function main() {
  const { startDate, endDate } = weekRange();
  const outPath = outArg
    ? join(repoRoot, outArg.slice("--out=".length))
    : defaultOutPath(endDate);

  if (useFixture) {
    const md = renderMarkdown({
      siteUrl: SITE_URL,
      startDate,
      endDate,
      rows: fixtureRows(),
      mode: "fixture",
      note: "サンプル行（本番 API 未接続）。秘匿情報は含まない。",
    });
    if (dryRun) {
      console.log(md);
      console.log("gsc-weekly-report: dry-run — file not written");
      return 0;
    }
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, md, "utf8");
    console.log(`wrote ${outPath}`);
    return 0;
  }

  if (!hasCredentials()) {
    const message = [
      "gsc-weekly-report: secrets missing — skip (exit 0).",
      "Set GSC_SERVICE_ACCOUNT_JSON or GSC_OAUTH_* (+ optional GSC_SITE_URL).",
      "See docs/secrets.md and docs/gsc-api-weekly-report.md.",
    ].join("\n");
    console.log(message);
    if (dryRun) {
      console.log(
        renderMarkdown({
          siteUrl: SITE_URL,
          startDate,
          endDate,
          rows: [],
          mode: "skipped-no-secrets",
          note: "シークレット未設定のためスキップ。",
        }),
      );
    }
    return 0;
  }

  try {
    const credsHint = hasServiceAccount() ? "service-account" : "oauth";
    const rows = await fetchSearchAnalytics(credsHint);
    const md = renderMarkdown({
      siteUrl: SITE_URL,
      startDate,
      endDate,
      rows,
      mode: credsHint,
      note: null,
    });
    if (dryRun) {
      console.log(md);
      return 0;
    }
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, md, "utf8");
    console.log(`wrote ${outPath}`);
    return 0;
  } catch (err) {
    // Skeleton: credentials may exist but API wiring is incomplete — soft skip
    console.warn(`gsc-weekly-report: ${err.message}`);
    console.warn("Soft-skip (exit 0) until API client is wired.");
    return 0;
  }
}

const code = await main();
process.exit(code);
