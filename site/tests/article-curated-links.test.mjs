import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getHubArticleMesh } from "../src/data/hub-article-mesh.ts";

describe("article curated links data", () => {
  it("returns hub mesh links excluding the current slug", () => {
    const mesh = getHubArticleMesh("sim");
    assert.ok(mesh);

    const currentSlug = "sim-osusume-hikaku-2026";
    const links = mesh.featured
      .filter((item) => item.slug !== currentSlug)
      .slice(0, 6);

    assert.ok(links.length > 0);
    assert.equal(
      links.some((item) => item.slug === currentSlug),
      false,
    );
  });
});
