import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fetchSearchAnalyticsReport,
  mapSearchAnalyticsRows,
  querySearchAnalytics,
  renderWeeklyReportMarkdown,
  rewriteCandidateRows,
  serializePerformanceCsv,
  weekRange,
} from "./search-analytics.mjs";

describe("search-analytics", () => {
  it("computes a 7-day window ending 3 days ago (UTC)", () => {
    const range = weekRange(new Date("2026-08-31T12:00:00.000Z"));
    assert.equal(range.endDate, "2026-08-28");
    assert.equal(range.startDate, "2026-08-22");
  });

  it("maps API rows including totals without keys", () => {
    const mapped = mapSearchAnalyticsRows([
      { clicks: 2, impressions: 100, ctr: 0.02, position: 12.4 },
      {
        keys: ["格安sim おすすめ"],
        clicks: 1,
        impressions: 40,
        ctr: 0.025,
        position: 18.1,
      },
    ]);
    assert.equal(mapped[0].query, "(all)");
    assert.equal(mapped[1].query, "格安sim おすすめ");
    assert.equal(mapped[1].clicks, 1);
  });

  it("selects rewrite candidates in the 11–30 band", () => {
    const rows = [
      { query: "top", position: 8, clicks: 10, impressions: 100, ctr: 0.1 },
      { query: "mid", position: 18.2, clicks: 2, impressions: 80, ctr: 0.025 },
      { query: "low", position: 40, clicks: 0, impressions: 10, ctr: 0 },
    ];
    assert.deepEqual(
      rewriteCandidateRows(rows).map((row) => row.query),
      ["mid"],
    );
  });

  it("queries Search Analytics and maps rows", async () => {
    const fetchImpl = async (url, init) => {
      assert.match(url, /searchAnalytics\/query$/);
      assert.equal(init.method, "POST");
      const body = JSON.parse(init.body);
      assert.equal(body.startDate, "2026-08-22");
      return {
        ok: true,
        json: async () => ({
          rows: [
            {
              keys: ["nuro光 料金"],
              clicks: 5,
              impressions: 220,
              ctr: 0.0227,
              position: 24.1,
            },
          ],
        }),
      };
    };

    const rows = await querySearchAnalytics("token", {
      siteUrl: "https://sim-hikari-guide.com/",
      startDate: "2026-08-22",
      endDate: "2026-08-28",
      dimensions: ["query"],
      fetchImpl,
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].query, "nuro光 料金");
  });

  it("falls back to the next siteUrl on 403", async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(decodeURIComponent(url));
      const isPrefix = url.includes(encodeURIComponent("https://sim-hikari-guide.com/"));
      if (isPrefix) {
        return {
          ok: false,
          status: 403,
          json: async () => ({ error: { message: "forbidden" } }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          rows: [{ clicks: 0, impressions: 3, ctr: 0, position: 0 }],
        }),
      };
    };

    const report = await fetchSearchAnalyticsReport("token", {
      startDate: "2026-08-22",
      endDate: "2026-08-28",
      siteUrls: ["https://sim-hikari-guide.com/", "sc-domain:sim-hikari-guide.com"],
      fetchImpl,
    });
    assert.equal(report.siteUrl, "sc-domain:sim-hikari-guide.com");
    assert.equal(report.totals.impressions, 3);
    assert.ok(calls.length >= 2);
  });

  it("renders totals, queries, and rewrite candidates", () => {
    const md = renderWeeklyReportMarkdown({
      siteUrl: "https://sim-hikari-guide.com/",
      startDate: "2026-08-22",
      endDate: "2026-08-28",
      totals: { clicks: 4, impressions: 200, ctr: 0.02, position: 16.5 },
      queries: [
        {
          query: "格安sim おすすめ",
          clicks: 3,
          impressions: 120,
          ctr: 0.025,
          position: 9.1,
        },
        {
          query: "nuro光 料金",
          clicks: 1,
          impressions: 80,
          ctr: 0.0125,
          position: 22.4,
        },
      ],
      mode: "service-account",
      generatedAt: "2026-08-31T00:00:00.000Z",
    });
    assert.match(md, /クリック \| 表示/);
    assert.match(md, /格安sim おすすめ/);
    assert.match(md, /nuro光 料金/);
    const rewriteSection = md.split("## リライト候補")[1];
    assert.match(rewriteSection, /nuro光 料金/);
    assert.doesNotMatch(rewriteSection, /格安sim おすすめ/);
  });

  it("serializes GSC performance CSV for rewrite-queue import", () => {
    const csv = serializePerformanceCsv([
      { query: "(all)", clicks: 4, impressions: 200, ctr: 0.02, position: 16.5 },
      {
        query: "nuro光, 料金",
        clicks: 1,
        impressions: 80,
        ctr: 0.0125,
        position: 22.4,
      },
    ]);
    assert.match(csv, /^Query,Clicks,Impressions,CTR,Position\n/);
    assert.doesNotMatch(csv, /\(all\)/);
    assert.match(csv, /"nuro光, 料金",1,80,0.0125,22.4/);
  });
});
