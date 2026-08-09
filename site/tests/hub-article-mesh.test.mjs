import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getHubArticleMesh,
  getHomeFeaturedArticles,
} from "../src/data/hub-article-mesh.ts";

describe("hub article mesh", () => {
  it("defines featured links for all category hubs", () => {
    for (const category of ["sim", "hikari", "trouble", "cost"]) {
      const mesh = getHubArticleMesh(category);
      assert.ok(mesh, `${category} mesh should exist`);
      assert.ok(mesh.featured.length >= 2);
      assert.match(mesh.hubHref, /^\//);
    }
  });

  it("returns two featured articles per category for the homepage", () => {
    const featured = getHomeFeaturedArticles();
    assert.equal(featured.length, 8);
    assert.ok(
      featured.every((item) => item.slug && item.label && item.category),
    );
  });

  it("lists every published article in hub mesh featured", async () => {
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync("node", ["scripts/audit-hub-mesh-coverage.mjs"], {
      cwd: new URL("../..", import.meta.url).pathname,
      encoding: "utf8",
    });
    assert.equal(
      result.status,
      0,
      result.stdout + result.stderr || "hub mesh coverage failed",
    );
  });
});
