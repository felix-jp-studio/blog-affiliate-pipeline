#!/usr/bin/env node
/**
 * GSC Search Analytics → weekly Markdown report.
 *
 * Credentials (GitHub Actions secrets / .env.local — do NOT commit):
 *   GSC_SITE_URL                 e.g. https://sim-hikari-guide.com/
 *   GSC_SERVICE_ACCOUNT_JSON     raw JSON for a Search Console SA
 *   — or OAuth —
 *   GSC_OAUTH_CLIENT_ID / GSC_OAUTH_CLIENT_SECRET / GSC_OAUTH_REFRESH_TOKEN
 *
 * Usage:
 *   node scripts/gsc-weekly-report.mjs
 *   node scripts/gsc-weekly-report.mjs --dry-run
 *   node scripts/gsc-weekly-report.mjs --fixture
 *   node scripts/gsc-weekly-report.mjs --out=docs/gsc-weekly/gsc-weekly-YYYYMMDD.md
 *
 * Exit 0 when secrets are missing (scheduled runs skip gracefully).
 * Exit 0 when --fixture generates a sample report.
 * Exit 2 on API errors after credentials are present.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { repoRoot } from "./e2e/e2e-utils.mjs";
import { hasApiCredentials, hasServiceAccount } from "./gsc/auth.mjs";
import {
  fetchSearchAnalyticsReport,
  getAccessToken,
  renderWeeklyReportMarkdown,
  weekRange,
} from "./gsc/search-analytics.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const useFixture = args.includes("--fixture");
const outArg = args.find((a) => a.startsWith("--out="));

function fixtureReport() {
  return {
    siteUrl: "https://sim-hikari-guide.com/",
    totals: { clicks: 20, impressions: 770, ctr: 0.026, position: 19.3 },
    queries: [
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
    ],
  };
}

function defaultOutPath(endDate) {
  const stamp = endDate.replaceAll("-", "");
  return join(repoRoot, "docs", "gsc-weekly", `gsc-weekly-${stamp}.md`);
}

function writeReport(outPath, markdown) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, markdown, "utf8");
  try {
    execFileSync("npx", ["prettier", "--write", outPath], { stdio: "ignore" });
  } catch {
    // prettier is optional when node_modules is not installed
  }
  console.log(`wrote ${outPath}`);
}

async function main() {
  const { startDate, endDate } = weekRange();
  const outPath = outArg
    ? join(repoRoot, outArg.slice("--out=".length))
    : defaultOutPath(endDate);

  if (useFixture) {
    const fixture = fixtureReport();
    const md = renderWeeklyReportMarkdown({
      siteUrl: fixture.siteUrl,
      startDate,
      endDate,
      totals: fixture.totals,
      queries: fixture.queries,
      mode: "fixture",
      note: "サンプル行（本番 API 未接続）。秘匿情報は含まない。",
    });
    if (dryRun) {
      console.log(md);
      console.log("gsc-weekly-report: dry-run — file not written");
      return 0;
    }
    writeReport(outPath, md);
    return 0;
  }

  if (!hasApiCredentials()) {
    const message = [
      "gsc-weekly-report: secrets missing — skip (exit 0).",
      "Set GSC_SERVICE_ACCOUNT_JSON or GSC_OAUTH_* (+ optional GSC_SITE_URL).",
      "See docs/secrets.md and docs/gsc-api-weekly-report.md.",
    ].join("\n");
    console.log(message);
    if (dryRun) {
      console.log(
        renderWeeklyReportMarkdown({
          siteUrl: "https://sim-hikari-guide.com/",
          startDate,
          endDate,
          totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
          queries: [],
          mode: "skipped-no-secrets",
          note: "シークレット未設定のためスキップ。",
        }),
      );
    }
    return 0;
  }

  const credsHint = hasServiceAccount() ? "service-account" : "oauth";
  const accessToken = await getAccessToken();
  const report = await fetchSearchAnalyticsReport(accessToken, {
    startDate,
    endDate,
  });
  const md = renderWeeklyReportMarkdown({
    siteUrl: report.siteUrl,
    startDate,
    endDate,
    totals: report.totals,
    queries: report.queries,
    mode: credsHint,
  });

  if (dryRun) {
    console.log(md);
    return 0;
  }

  writeReport(outPath, md);
  return 0;
}

try {
  const code = await main();
  process.exit(code);
} catch (error) {
  console.error(`gsc-weekly-report: ${error.message}`);
  process.exit(2);
}
