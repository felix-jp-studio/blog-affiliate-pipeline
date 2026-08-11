import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inferCategory,
  makeLabelFromTitle,
  pickUnusedKeywords,
  selectActType,
  selectTemplate,
} from "./lib.mjs";

describe("visitability lib", () => {
  it("infers category from keyword and article type", () => {
    assert.equal(inferCategory("docomo光 比較", "comparison"), "hikari");
    assert.equal(inferCategory("格安SIM MNP 手順", "howto"), "sim");
    assert.equal(inferCategory("速度 遅い 対処", "troubleshoot"), "trouble");
    assert.equal(inferCategory("auでんき セット割", "crosssell"), "cost");
  });

  it("shortens long titles for hub labels", () => {
    const label = makeLabelFromTitle(
      "とても長いタイトルで30文字を超える記事タイトル例【2026年版】",
    );
    assert.ok(label.length <= 24);
  });

  it("selects template from ratio gaps", () => {
    const template = selectTemplate(
      { typeRatioGaps: { crosssell: 0.1, howto: 0, troubleshoot: 0 } },
      { cycleNumber: 33 },
    );
    assert.equal(template, "comparison_x2_crosssell");
  });

  it("picks unused keywords by type", () => {
    const seed = [
      { keyword: "a", articleType: "howto", priority: 1 },
      { keyword: "b", articleType: "howto", priority: 2 },
    ];
    const used = new Set(["a"]);
    const picks = pickUnusedKeywords(seed, used, "howto", 1);
    assert.deepEqual(
      picks.map((row) => row.keyword),
      ["b"],
    );
  });

  it("selects index_push when queue rate is low", () => {
    const result = selectActType(
      {
        indexQueueRate: 0.2,
        indexQueuePending: 15,
        rewriteQueueCount: 0,
        orphanArticleCount: 0,
        typeRatioGaps: {},
      },
      {},
    );
    assert.equal(result.actType, "index_push");
  });

  it("selects rewrite_cycle when queue has items", () => {
    const result = selectActType(
      {
        indexQueueRate: 0.5,
        indexQueuePending: 0,
        rewriteQueueCount: 5,
        orphanArticleCount: 0,
        typeRatioGaps: {},
      },
      {},
    );
    assert.equal(result.actType, "rewrite_cycle");
  });
});
