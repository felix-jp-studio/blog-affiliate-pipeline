import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildBreadcrumbJsonLd } from "../src/utils/breadcrumb-jsonld.ts";
import { buildBreadcrumbs } from "../src/data/site-nav.ts";

describe("breadcrumb jsonld", () => {
  it("builds BreadcrumbList schema for hub pages", () => {
    const breadcrumbs = buildBreadcrumbs([{ label: "格安SIM", href: "/sim" }]);
    const jsonLd = buildBreadcrumbJsonLd(
      breadcrumbs,
      "https://sim-hikari-guide.com",
    );

    assert.equal(jsonLd["@type"], "BreadcrumbList");
    assert.equal(Array.isArray(jsonLd.itemListElement), true);
    assert.equal(jsonLd.itemListElement?.length, 2);
    assert.equal(jsonLd.itemListElement?.[0].name, "ホーム");
    assert.equal(jsonLd.itemListElement?.[1].name, "格安SIM");
  });
});
