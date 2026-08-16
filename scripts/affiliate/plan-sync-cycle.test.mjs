import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAffiliateAgentPrompt,
  buildUserChecklist,
  collectSyncTargets,
  planAffiliateSync,
} from "./plan-sync-cycle.mjs";
import { readAspUrls } from "./lib.mjs";

const registry = readAspUrls();

describe("collectSyncTargets", () => {
  it("includes pending programs without trackingUrl", () => {
    const targets = collectSyncTargets(registry, null, { referenceDate: "2026-08-16" });
    const pending = targets.filter((t) => t.reason === "pending-without-trackingUrl");
    assert.ok(pending.some((t) => t.programKey === "uq-mobile"));
  });

  it("includes health report probe failures", () => {
    const healthReport = {
      alerts: [
        {
          programKey: "rakuten-mobile",
          type: "probe-failed",
          message: "probe failed",
        },
      ],
    };
    const targets = collectSyncTargets(registry, healthReport);
    assert.ok(
      targets.some(
        (t) => t.programKey === "rakuten-mobile" && t.reason === "probe-failed",
      ),
    );
  });

  it("prioritizes pending over stale lastVerified", () => {
    const healthReport = {
      alerts: [
        {
          programKey: "rakuten-mobile",
          type: "stale-lastVerified",
          message: "stale",
        },
      ],
    };
    const targets = collectSyncTargets(registry, healthReport, {
      alertDays: 1,
      referenceDate: "2026-08-16",
    });
    const uqIndex = targets.findIndex((t) => t.programKey === "uq-mobile");
    const rakutenIndex = targets.findIndex((t) => t.programKey === "rakuten-mobile");
    if (uqIndex >= 0 && rakutenIndex >= 0) {
      assert.ok(uqIndex < rakutenIndex);
    }
  });
});

describe("planAffiliateSync", () => {
  it("plans cycle when targets exist", () => {
    const result = planAffiliateSync(
      { cycleNumber: 1, consecutiveFailures: 0, paused: false, blockers: [] },
      registry,
      null,
      { referenceDate: "2026-08-16" },
    );
    assert.equal(result.action, "plan");
    assert.ok(result.brief.tasks.length > 0);
    assert.match(result.brief.agentPrompt, /Affiliate Sync Cycle 1/);
  });

  it("skips when paused", () => {
    const result = planAffiliateSync(
      { cycleNumber: 1, consecutiveFailures: 0, paused: true, blockers: [] },
      registry,
      null,
    );
    assert.equal(result.action, "skip");
  });
});

describe("buildUserChecklist", () => {
  it("includes portal links and manual steps", () => {
    const tasks = [
      {
        programKey: "uq-mobile",
        label: "UQ mobile",
        provider: "a8",
        portalUrl: "https://pub.a8.net/",
      },
    ];
    const checklist = buildUserChecklist(tasks, registry);
    assert.match(checklist, /ログインできません/);
    assert.match(checklist, /pub\.a8\.net/);
    assert.match(checklist, /affiliate:parse/);
  });
});

describe("buildAffiliateAgentPrompt", () => {
  it("lists constraints and acceptance", () => {
    const prompt = buildAffiliateAgentPrompt({
      cycleNumber: 2,
      tasks: [
        {
          programKey: "uq-mobile",
          reason: "pending-without-trackingUrl",
          label: "UQ mobile",
        },
      ],
    });
    assert.match(prompt, /自動ログイン禁止/);
    assert.match(prompt, /test:affiliate/);
    assert.match(prompt, /uq-mobile/);
  });
});
