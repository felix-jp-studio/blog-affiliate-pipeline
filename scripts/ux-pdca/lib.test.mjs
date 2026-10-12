import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cwvRegressionFromBaseline,
  parseCwvBaseline,
  pendingTasks,
  buildAgentPrompt,
  findOpenIssueByTitle,
  openWorkSkipReason,
} from "./lib.mjs";

describe("ux-pdca lib", () => {
  it("parses CWV baseline table rows", () => {
    const sample = `
| 週（JST）  | 実行元 | URL | Perf | A11y | BP | SEO | LCP (ms) | CLS | TBT (ms) | 備考 |
| 2026-08-01 | local | \`/\` | 0.55 | 1.00 | 1.00 | 1.00 | 14004 | 0.000 | 0 | seed |
| 2026-08-08 | gha | \`/\` | 0.48 | 1.00 | 1.00 | 1.00 | 15000 | 0.100 | 50 | drop |
`;
    const rows = parseCwvBaseline(sample);
    assert.equal(rows.length, 2);
    assert.equal(rows[1].perf, 0.48);
  });

  it("detects CWV performance regression", () => {
    const result = cwvRegressionFromBaseline([
      { perf: 0.6, cls: 0, lcp: 3000 },
      { perf: 0.5, cls: 0, lcp: 3100 },
    ]);
    assert.equal(result.regression, true);
  });

  it("sorts pending tasks by priority", () => {
    const sorted = pendingTasks([
      { id: "a", status: "pending", priority: 70 },
      { id: "b", status: "pending", priority: 90 },
    ]);
    assert.equal(sorted[0].id, "b");
  });

  it("builds agent prompt with branch name", () => {
    const prompt = buildAgentPrompt(
      {
        title: "Test task",
        targetPaths: ["site/src/components/Foo.astro"],
        acceptance: ["visual pass"],
      },
      3,
    );
    assert.match(prompt, /feature\/ux-pdca-3/);
    assert.match(prompt, /Test task/);
  });
});

describe("openWorkSkipReason", () => {
  it("plans when nothing is in flight", () => {
    assert.equal(openWorkSkipReason({ openUxPrs: 0, openAgentIssues: 0 }), null);
    assert.equal(openWorkSkipReason(), null);
  });

  it("skips while a PR or an agent issue is still open", () => {
    assert.match(openWorkSkipReason({ openUxPrs: 2 }), /Open UX PRs: 2/);
    assert.match(openWorkSkipReason({ openAgentIssues: 3 }), /Open UX agent issues: 3/);
  });
});

describe("findOpenIssueByTitle", () => {
  const issues = [
    { number: 1, title: "UX PDCA Cycle 6: a", url: "u1" },
    { number: 2, title: "UX PDCA Cycle 7: b", url: "u2" },
  ];

  it("finds the issue already filed for a title", () => {
    assert.equal(findOpenIssueByTitle(issues, "UX PDCA Cycle 7: b").number, 2);
  });

  it("returns null for a new title or an empty list", () => {
    assert.equal(findOpenIssueByTitle(issues, "UX PDCA Cycle 8: c"), null);
    assert.equal(findOpenIssueByTitle([], "anything"), null);
  });
});
