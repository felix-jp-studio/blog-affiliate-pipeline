import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rehypeCtaPlacement } from "../src/plugins/rehype-cta-placement.ts";

function ctaBlock(id) {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["affiliate-cta-block"] },
    children: [{ type: "text", value: id }],
  };
}

function tableScrollNode() {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["table-scroll"] },
    children: [
      {
        type: "element",
        tagName: "table",
        properties: {},
        children: [],
      },
    ],
  };
}

describe("rehypeCtaPlacement", () => {
  it("moves CTA blocks after the first table-scroll wrapper", () => {
    const tree = {
      type: "root",
      children: [
        tableScrollNode(),
        ctaBlock("cta-a"),
        { type: "element", tagName: "p", properties: {}, children: [] },
      ],
    };

    rehypeCtaPlacement()(tree);

    assert.equal(tree.children.length, 3);
    assert.equal(tree.children[0].properties.className[0], "table-scroll");
    assert.equal(
      tree.children[1].properties.className[0],
      "affiliate-cta-block",
    );
    assert.equal(tree.children[2].tagName, "p");
  });

  it("keeps CTA blocks in place when no insert point is found", () => {
    const tree = {
      type: "root",
      children: [
        ctaBlock("cta-a"),
        { type: "element", tagName: "p", properties: {}, children: [] },
      ],
    };

    rehypeCtaPlacement()(tree);

    assert.equal(tree.children.length, 2);
    assert.equal(
      tree.children[0].properties.className[0],
      "affiliate-cta-block",
    );
  });
});
