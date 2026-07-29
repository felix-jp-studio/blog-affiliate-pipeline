import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveDateModified } from "../src/utils/article-dates.ts";

describe("resolveDateModified", () => {
  it("falls back to pubDate when dateModified is absent", () => {
    const pubDate = new Date("2026-07-17");
    assert.equal(
      resolveDateModified(pubDate).toISOString(),
      pubDate.toISOString(),
    );
  });

  it("uses dateModified when provided", () => {
    const pubDate = new Date("2026-07-17");
    const dateModified = new Date("2026-07-29");
    assert.equal(
      resolveDateModified(pubDate, dateModified).toISOString(),
      dateModified.toISOString(),
    );
  });
});
