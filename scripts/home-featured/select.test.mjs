import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregatePageMetrics,
  latestPagesCsvNames,
  renderHomeFeaturedModule,
  selectHomeFeatured,
  slugFromPageUrl,
} from "./select.mjs";

const HEADER = "Page,Clicks,Impressions,CTR,Position";
const url = (slug) => `https://sim-hikari-guide.com/articles/${slug}`;

function meshOf(slugs) {
  return { featured: slugs.map((slug) => ({ slug, label: slug })) };
}

describe("latestPagesCsvNames", () => {
  it("keeps the newest weekly page CSVs only", () => {
    const names = [
      "gsc-pages-20261009.csv",
      "gsc-performance-20261009.csv",
      "gsc-pages-20260918.csv",
      "gsc-pages-20261002.csv",
      "rewrite-queue.csv",
    ];
    assert.deepEqual(latestPagesCsvNames(names, 2), [
      "gsc-pages-20261002.csv",
      "gsc-pages-20261009.csv",
    ]);
  });
});

describe("slugFromPageUrl", () => {
  it("extracts article slugs and ignores other pages", () => {
    assert.equal(slugFromPageUrl(url("mnp-error-fix")), "mnp-error-fix");
    assert.equal(slugFromPageUrl(`${url("mnp-error-fix")}/`), "mnp-error-fix");
    assert.equal(slugFromPageUrl("https://sim-hikari-guide.com/"), null);
    assert.equal(slugFromPageUrl("https://sim-hikari-guide.com/sim"), null);
    assert.equal(slugFromPageUrl("not a url"), null);
  });
});

describe("aggregatePageMetrics", () => {
  it("sums weeks and weights position by impressions", () => {
    const metrics = aggregatePageMetrics([
      `${HEADER}\n${url("a")},1,10,0.1,4.0\nhttps://sim-hikari-guide.com/,3,9,0.3,1.0\n`,
      `${HEADER}\n${url("a")},2,30,0.06,8.0\n`,
    ]);
    assert.deepEqual(metrics.get("a"), { clicks: 3, impressions: 40, position: 7 });
    assert.equal(metrics.size, 1);
  });
});

describe("selectHomeFeatured", () => {
  const mesh = {
    sim: meshOf(["s1", "s2", "s3", "s4"]),
    hikari: meshOf(["h1", "h2", "h3"]),
    trouble: meshOf(["t1", "t2"]),
    cost: meshOf(["c1", "c2", "c3"]),
  };
  const publishedSlugs = new Set([
    "s1",
    "s2",
    "s3",
    "s4",
    "h1",
    "h2",
    "h3",
    "t1",
    "t2",
    "c1",
    "c2",
  ]);

  it("ranks by clicks, then impressions, then position", () => {
    const metrics = new Map([
      ["s3", { clicks: 2, impressions: 5, position: 9 }],
      ["s4", { clicks: 0, impressions: 50, position: 20 }],
      ["s2", { clicks: 0, impressions: 50, position: 10 }],
    ]);
    const picks = selectHomeFeatured({ mesh, publishedSlugs, metrics });
    assert.deepEqual(picks.sim, ["s3", "s2"]);
  });

  it("falls back to previous picks, then mesh order, when GSC has no data", () => {
    const picks = selectHomeFeatured({
      mesh,
      publishedSlugs,
      metrics: new Map(),
      previous: { hikari: ["h3", "h2"] },
    });
    assert.deepEqual(picks.hikari, ["h3", "h2"]);
    assert.deepEqual(picks.trouble, ["t1", "t2"]);
  });

  it("skips unpublished articles", () => {
    const metrics = new Map([["c3", { clicks: 9, impressions: 99, position: 1 }]]);
    const picks = selectHomeFeatured({ mesh, publishedSlugs, metrics });
    assert.deepEqual(picks.cost, ["c1", "c2"]);
  });
});

describe("renderHomeFeaturedModule", () => {
  it("writes a TS module with the picks and basis", () => {
    const content = renderHomeFeaturedModule({
      picks: { sim: ["s1", "s2"], cost: ["c1"] },
      updatedAt: "2026-11-01",
      sources: ["gsc-pages-20261026.csv"],
    });
    assert.match(content, /homeFeaturedUpdatedAt = "2026-11-01";/);
    assert.match(content, /homeFeaturedBasis = "gsc-pages-20261026.csv";/);
    assert.match(content, /\n {2}sim: \["s1", "s2"\],\n {2}cost: \["c1"\],\n\};/);
  });
});
