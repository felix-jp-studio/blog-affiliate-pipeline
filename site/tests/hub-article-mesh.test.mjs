import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getHubArticleMesh } from "../src/data/hub-article-mesh.ts";

describe("hub article mesh", () => {
  it("defines featured links for all category hubs", () => {
    for (const category of ["sim", "hikari", "trouble", "cost"]) {
      const mesh = getHubArticleMesh(category);
      assert.ok(mesh, `${category} mesh should exist`);
      assert.ok(mesh.featured.length >= 2);
      assert.match(mesh.hubHref, /^\//);
    }
  });
});
