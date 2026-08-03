import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SITE_NAME,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "../src/utils/site-jsonld.ts";

describe("site jsonld", () => {
  it("builds WebSite schema for the homepage", () => {
    const jsonLd = buildWebSiteJsonLd("https://sim-hikari-guide.com");

    assert.equal(jsonLd["@type"], "WebSite");
    assert.equal(jsonLd.name, SITE_NAME);
    assert.equal(jsonLd.url, "https://sim-hikari-guide.com");
    assert.equal(jsonLd.inLanguage, "ja-JP");
    assert.equal(jsonLd.publisher?.["@type"], "Organization");
  });

  it("builds Organization schema for the about page", () => {
    const jsonLd = buildOrganizationJsonLd("https://sim-hikari-guide.com");

    assert.equal(jsonLd["@type"], "Organization");
    assert.equal(jsonLd.name, SITE_NAME);
    assert.equal(jsonLd.url, "https://sim-hikari-guide.com");
  });
});
