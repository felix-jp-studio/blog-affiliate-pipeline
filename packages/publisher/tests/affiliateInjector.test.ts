import { describe, expect, it } from "vitest";
import {
  injectAffiliateLinks,
  assertNoForbiddenPhrases,
} from "../src/affiliateInjector.js";
import { resolve } from "node:path";

const rulesPath = resolve(import.meta.dirname, "../../../config/affiliate-rules.json");

describe("affiliateInjector", () => {
  it("injects carrier links for comparison type", () => {
    const html = injectAffiliateLinks("<p>本文</p>", "comparison", rulesPath);
    expect(html).toContain('data-affiliate-injected="true"');
    expect(html).toContain("楽天モバイル");
    expect(html).toContain('rel="sponsored noopener"');
  });

  it("rejects forbidden phrases", () => {
    expect(() => assertNoForbiddenPhrases("これは絶対お得", rulesPath)).toThrow(
      "禁止表現",
    );
  });
});
