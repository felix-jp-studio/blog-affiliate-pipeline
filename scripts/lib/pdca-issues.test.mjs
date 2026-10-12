import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { closeIssuesForPr, issuesClosedByPr } from "./pdca-issues.mjs";

const TITLE = "Refactor PDCA Cycle 6: changed-slugs.mjs の unit test 追加";
const issues = [
  { number: 287, title: TITLE },
  { number: 289, title: TITLE },
  { number: 291, title: "UX PDCA Cycle 7: Breadcrumbs のモバイル折り返し・省略表示" },
];

describe("issuesClosedByPr", () => {
  it("matches every duplicate filed for the same cycle", () => {
    assert.deepEqual(
      issuesClosedByPr(issues, TITLE).map((i) => i.number),
      [287, 289],
    );
  });

  it("ignores surrounding whitespace", () => {
    assert.equal(issuesClosedByPr(issues, `  ${TITLE}  `).length, 2);
  });

  it("returns nothing for a different, empty or missing title", () => {
    assert.deepEqual(issuesClosedByPr(issues, "chore: unrelated"), []);
    assert.deepEqual(issuesClosedByPr(issues, "   "), []);
    assert.deepEqual(issuesClosedByPr(issues, undefined), []);
  });
});

describe("closeIssuesForPr", () => {
  const base = { issues, prTitle: TITLE, prUrl: "https://example/pr/1", repo: "o/r" };

  it("closes each match and reports the numbers", () => {
    const calls = [];
    const closed = closeIssuesForPr({ ...base, run: (args) => calls.push(args) });
    assert.deepEqual(closed, [287, 289]);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].slice(0, 3), ["issue", "close", "287"]);
    assert.equal(calls[0].at(-1), "Resolved by https://example/pr/1.");
  });

  it("keeps going when one close fails", () => {
    const closed = closeIssuesForPr({
      ...base,
      run: (args) => {
        if (args[2] === "287") throw new Error("not found");
        return "";
      },
    });
    assert.deepEqual(closed, [289]);
  });

  it("does nothing when no issue matches", () => {
    const calls = [];
    const closed = closeIssuesForPr({
      ...base,
      prTitle: "chore: unrelated",
      run: (args) => calls.push(args),
    });
    assert.deepEqual(closed, []);
    assert.equal(calls.length, 0);
  });
});
