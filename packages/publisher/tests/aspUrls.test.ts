import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import {
  affiliateHostPatterns,
  loadAspUrls,
  resolveCarrierUrl,
  resolveProgramUrl,
} from "../src/aspUrls.js";

const aspUrlsPath = resolve(import.meta.dirname, "../../../config/asp-urls.json");

describe("aspUrls", () => {
  const registry = loadAspUrls(aspUrlsPath);

  it("resolves active tracking URLs", () => {
    const url = resolveProgramUrl(registry, "rakuten-mobile");
    expect(url).toContain("px.a8.net");
  });

  it("falls back to official URL for pending programs", () => {
    const url = resolveProgramUrl(registry, "povo");
    expect(url).toBe("https://povo.jp/");
  });

  it("resolves carrier program refs from affiliate rules shape", () => {
    const url = resolveCarrierUrl(registry, { program: "linemo" });
    expect(url).toContain("valuecommerce.com");
  });

  it("lists active ASP host patterns only", () => {
    const patterns = affiliateHostPatterns(registry);
    expect(patterns).toContain("px.a8.net");
    expect(patterns).not.toContain("af.moshimo.com");
  });
});
