import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCycleBatch,
  buildItems,
  buildKeywordAppend,
  cycleBatchPath,
  inferCategory,
  makeLabelFromTitle,
  pickUnusedKeywords,
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
});

function makeSeed() {
  const types = ["comparison", "howto", "troubleshoot", "crosssell"];
  const rows = [];
  let priority = 1;
  for (const articleType of types) {
    for (let i = 0; i < 8; i += 1) {
      rows.push({
        keyword: `${articleType}-kw-${i}`,
        articleType,
        priority: priority++,
      });
    }
  }
  return rows;
}

describe("visitability plan helpers", () => {
  it("appends up to 10 unused keywords across types", () => {
    const used = new Set();
    const append = buildKeywordAppend(makeSeed(), used, 100);
    assert.equal(append.length, 10);
    assert.equal(append[0].priority, 101);
    assert.equal(new Set(append.map((row) => row.keyword)).size, 10);
  });

  it("builds template items or reports insufficient keywords", () => {
    const ok = buildItems("howto_x2_trouble", makeSeed(), new Set(), 200);
    assert.equal(ok.ok, true);
    assert.equal(ok.items.length, 3);
    assert.equal(ok.items[0].articleType, "howto");
    assert.ok(ok.items[0].category);

    const empty = buildItems(
      "howto_x2_trouble",
      [{ keyword: "only-cmp", articleType: "comparison", priority: 1 }],
      new Set(),
      200,
    );
    assert.equal(empty.ok, false);
    assert.match(empty.reason, /Insufficient unused howto/);
  });

  it("builds the Plan/Act batch payload", () => {
    const batch = buildCycleBatch({
      cycleNumber: 37,
      template: "howto_x2_trouble",
      items: [{ keyword: "x", articleType: "howto" }],
    });
    assert.equal(batch.description, "Cycle 37 — auto PDCA (howto_x2_trouble)");
    assert.equal(batch.items.length, 1);
    assert.match(cycleBatchPath(37), /batch-cycle37-auto\.json$/);
  });
});
