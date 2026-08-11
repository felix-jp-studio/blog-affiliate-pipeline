import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALLOW_SCOPE,
  DENY_SCOPE,
  MAX_DIFF_LINES,
  MAX_FILES,
  buildAgentPrompt,
  pendingTasks,
  selectTask,
} from "./lib.mjs";

describe("refactor pdca lib", () => {
  it("prioritizes prettier drift script task", () => {
    const { task, reason } = selectTask({ formatDriftFiles: 3, openRefactorPrs: 0 });
    assert.equal(task?.id, "root-prettier-scripts-drift");
    assert.match(reason, /prettier/i);
  });

  it("selects highest priority backlog task when no drift", () => {
    const { task } = selectTask({ formatDriftFiles: 0, openRefactorPrs: 0 });
    assert.ok(task);
    assert.notEqual(task.id, "root-prettier-scripts-drift");
  });

  it("sorts pending tasks by priority descending", () => {
    const sorted = pendingTasks([
      { id: "a", status: "pending", priority: 70 },
      { id: "b", status: "pending", priority: 90 },
    ]);
    assert.equal(sorted[0].id, "b");
  });

  it("builds agent prompt with constraints", () => {
    const prompt = buildAgentPrompt(
      {
        title: "e2e-utils の重複ヘルパー統合",
        targetPaths: ["scripts/e2e/"],
        acceptance: ["npm run test:e2e:articles"],
      },
      2,
    );
    assert.match(prompt, /Refactor PDCA Cycle 2/);
    assert.match(prompt, /feature\/refactor-pdca-2/);
    assert.match(prompt, /300 行/);
  });

  it("defines scope limits", () => {
    assert.ok(ALLOW_SCOPE.some((p) => p.startsWith("scripts/")));
    assert.ok(DENY_SCOPE.some((p) => p.includes("articles")));
    assert.equal(MAX_DIFF_LINES, 300);
    assert.equal(MAX_FILES, 15);
  });
});
