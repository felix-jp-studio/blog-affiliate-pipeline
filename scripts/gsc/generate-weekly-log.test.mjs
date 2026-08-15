import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  estimateDaysToComplete,
  renderWeeklyLog,
  weekNumberFromDomainStart,
} from "./generate-weekly-log.mjs";

describe("generate-weekly-log", () => {
  it("estimates completion days from pending count", () => {
    assert.equal(estimateDaysToComplete(0), 0);
    assert.equal(estimateDaysToComplete(77), 8);
    assert.equal(estimateDaysToComplete(10), 1);
    assert.equal(estimateDaysToComplete(11), 2);
  });

  it("computes week number from domain start", () => {
    assert.equal(weekNumberFromDomainStart("2026-07-13"), 1);
    assert.equal(weekNumberFromDomainStart("2026-08-15"), 5);
  });

  it("renders markdown with agent-managed metrics", () => {
    const md = renderWeeklyLog({
      logDate: "2026-08-15",
      stats: { total: 144, indexed: 67, pending: 77 },
      articleCount: 145,
      inspectRun: "docs/operations/gsc-inspect-run-2026-08-15.md",
      userComment: "表示0、クリック0、インデックス54",
    });
    assert.match(md, /Week 5/);
    assert.match(md, /pending\s+\|\s+77/);
    assert.match(md, /145/);
    assert.match(md, /表示0、クリック0、インデックス54/);
    assert.match(md, /issue-229-secrets-checklist/);
  });
});
