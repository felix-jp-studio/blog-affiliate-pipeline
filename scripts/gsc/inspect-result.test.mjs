import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isIndexedStatus, parseIndexStatus } from "./inspect-result.mjs";

describe("inspect-result", () => {
  it("marks PASS verdict as indexed", () => {
    assert.equal(isIndexedStatus({ verdict: "PASS" }), true);
  });

  it("marks known coverage states as indexed", () => {
    assert.equal(isIndexedStatus({ coverageState: "Submitted and indexed" }), true);
  });

  it("does not mark NEUTRAL as indexed", () => {
    assert.equal(
      isIndexedStatus({ verdict: "NEUTRAL", coverageState: "URL is unknown to Google" }),
      false,
    );
  });

  it("parses index status fields", () => {
    const parsed = parseIndexStatus({
      verdict: "PASS",
      coverageState: "Submitted and indexed",
      indexingState: "INDEXING_ALLOWED",
      lastCrawlTime: "2026-08-01T00:00:00Z",
    });
    assert.equal(parsed.verdict, "PASS");
    assert.equal(parsed.coverageState, "Submitted and indexed");
    assert.equal(parsed.lastCrawlTime, "2026-08-01T00:00:00Z");
  });
});
