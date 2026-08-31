/**
 * Search Console Search Analytics query helpers.
 */
import { getAccessToken, siteUrlCandidates } from "./auth.mjs";

const SEARCH_ANALYTICS_ROOT = "https://www.googleapis.com/webmasters/v3/sites";

export function weekRange(now = new Date()) {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 3),
  );
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

export function mapSearchAnalyticsRows(apiRows = []) {
  return apiRows.map((row) => ({
    query: Array.isArray(row.keys) && row.keys.length > 0 ? String(row.keys[0]) : "(all)",
    clicks: Number(row.clicks ?? 0),
    impressions: Number(row.impressions ?? 0),
    ctr: Number(row.ctr ?? 0),
    position: Number(row.position ?? 0),
  }));
}

export function rewriteCandidateRows(rows, minPosition = 11, maxPosition = 30) {
  return rows.filter((row) => row.position >= minPosition && row.position <= maxPosition);
}

function csvField(value) {
  return String(value).replaceAll(",", " ");
}

/** GSC Performance CSV compatible with `gsc-import-rewrite-queue.mjs`. */
export function serializePerformanceCsv(rows) {
  const lines = ["Query,Clicks,Impressions,CTR,Position"];
  for (const row of rows) {
    if (!row.query || row.query === "(all)") continue;
    lines.push(
      [
        csvField(row.query),
        row.clicks,
        row.impressions,
        row.ctr,
        Number(row.position).toFixed(1),
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function searchAnalyticsUrl(siteUrl) {
  return `${SEARCH_ANALYTICS_ROOT}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
}

function isPermissionDenied(error) {
  return error instanceof Error && /\b403\b/.test(error.message);
}

/**
 * @param {string} accessToken
 * @param {{
 *   siteUrl: string,
 *   startDate: string,
 *   endDate: string,
 *   dimensions?: string[],
 *   rowLimit?: number,
 *   fetchImpl?: typeof fetch,
 * }} options
 */
export async function querySearchAnalytics(accessToken, options) {
  const {
    siteUrl,
    startDate,
    endDate,
    dimensions,
    rowLimit = 25,
    fetchImpl = fetch,
  } = options;

  const body = {
    startDate,
    endDate,
    rowLimit,
    startRow: 0,
  };
  if (Array.isArray(dimensions) && dimensions.length > 0) {
    body.dimensions = dimensions;
  }

  const response = await fetchImpl(searchAnalyticsUrl(siteUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `Search Analytics API ${response.status}: ${JSON.stringify(payload)}`,
    );
  }
  return mapSearchAnalyticsRows(payload.rows ?? []);
}

/**
 * Query totals + top queries, retrying URL-prefix vs sc-domain on 403.
 */
export async function fetchSearchAnalyticsReport(accessToken, options = {}) {
  const { startDate, endDate, rowLimit = 25, fetchImpl = fetch } = options;
  const candidates =
    options.siteUrls ?? (options.siteUrl ? [options.siteUrl] : siteUrlCandidates());

  let lastError;
  for (const siteUrl of candidates) {
    try {
      const totals = await querySearchAnalytics(accessToken, {
        siteUrl,
        startDate,
        endDate,
        rowLimit: 1,
        fetchImpl,
      });
      const queries = await querySearchAnalytics(accessToken, {
        siteUrl,
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit,
        fetchImpl,
      });
      return {
        siteUrl,
        totals: totals[0] ?? {
          query: "(all)",
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
        },
        queries,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (!isPermissionDenied(lastError)) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error("Search Analytics API failed");
}

export function renderWeeklyReportMarkdown({
  siteUrl,
  startDate,
  endDate,
  totals,
  queries,
  mode,
  note,
  generatedAt = new Date().toISOString(),
}) {
  const rows = queries ?? [];
  const rewriteRows = rewriteCandidateRows(rows);
  const totalsRow = totals ?? {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0,
  };

  const lines = [
    `# GSC 週次レポート（${startDate}〜${endDate}）`,
    "",
    `- プロパティ: \`${siteUrl}\``,
    `- 生成モード: \`${mode}\``,
    `- 生成日時 (UTC): ${generatedAt}`,
    "",
  ];
  if (note) {
    lines.push(`> ${note}`, "");
  }

  lines.push(
    "## サイト全体",
    "",
    "| クリック | 表示 | CTR | 平均順位 |",
    "| -------: | ---: | --: | -------: |",
    `| ${totalsRow.clicks} | ${totalsRow.impressions} | ${(totalsRow.ctr * 100).toFixed(2)}% | ${totalsRow.position.toFixed(1)} |`,
    "",
    "## 上位クエリ",
    "",
    "| クエリ | クリック | 表示 | CTR | 平均順位 |",
    "| ------ | -------: | ---: | --: | -------: |",
  );

  if (rows.length === 0) {
    lines.push("| _該当クエリなし_ | 0 | 0 | 0.00% | 0.0 |");
  } else {
    for (const row of rows) {
      lines.push(
        `| ${row.query} | ${row.clicks} | ${row.impressions} | ${(row.ctr * 100).toFixed(2)}% | ${row.position.toFixed(1)} |`,
      );
    }
  }

  lines.push("", "## リライト候補（11–30 位）", "");
  if (rewriteRows.length === 0) {
    lines.push("_該当なし_", "");
  } else {
    lines.push(
      "| クエリ | クリック | 表示 | CTR | 平均順位 |",
      "| ------ | -------: | ---: | --: | -------: |",
    );
    for (const row of rewriteRows) {
      lines.push(
        `| ${row.query} | ${row.clicks} | ${row.impressions} | ${(row.ctr * 100).toFixed(2)}% | ${row.position.toFixed(1)} |`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## 次アクション",
    "",
    "- 11–30 位は Workflow が `data/rewrite-queue.csv` へ自動取り込み（`gsc:import-rewrite-queue`）",
    "- 手動ベースライン: `blog-affiliate-auto/docs/operations/gsc-baseline.md`",
    "",
  );
  return `${lines.join("\n")}\n`;
}

export { getAccessToken };
