import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getHubArticleMesh } from "../src/data/hub-article-mesh.ts";

describe("hub article mesh", () => {
  it("defines featured links for sim, hikari, and cost hubs", () => {
    for (const category of ["sim", "hikari", "cost"]) {
      const mesh = getHubArticleMesh(category);
      assert.ok(mesh, `${category} mesh should exist`);
      assert.ok(mesh.featured.length >= 2);
      assert.match(mesh.hubHref, /^\//);
    }
  });

  it("returns undefined for categories without a fixed mesh", () => {
    assert.equal(getHubArticleMesh("trouble"), undefined);
  });
});
