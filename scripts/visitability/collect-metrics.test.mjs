import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadArticleCounts, loadIndexQueueMetrics } from "./lib.mjs";

describe("collect-metrics helpers", () => {
  it("loads article counts with ratios", () => {
    const report = loadArticleCounts();
    assert.ok(report.total > 0);
    assert.ok("comparison" in report.counts);
    assert.ok(report.ratios.comparison >= 0 && report.ratios.comparison <= 1);
  });

  it("loads index queue metrics", () => {
    const metrics = loadIndexQueueMetrics();
    assert.ok(metrics.total >= 0);
    assert.ok(metrics.rate >= 0 && metrics.rate <= 1);
  });
});
