import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyIntake,
  buildLastVerifiedAlert,
  buildProgramUrlIndex,
  daysSinceIsoDate,
  findHardcodedAspUrls,
  inferProviderFromUrl,
  migrateMarkdownLinks,
  probeTrackingUrl,
  readAspUrls,
  resolveProgramKeyFromUrl,
  runAffiliateHealthCheck,
  validateAspProgramId,
  validateProgramKey,
  validateTrackingUrl,
} from "./lib.mjs";

const registry = readAspUrls();

describe("validateProgramKey", () => {
  it("accepts lowercase slugs", () => {
    assert.equal(validateProgramKey("uq-mobile"), null);
  });

  it("rejects invalid slugs", () => {
    assert.match(validateProgramKey("UQ Mobile"), /slug/);
  });
});

describe("validateTrackingUrl", () => {
  it("accepts A8 tracking URLs", () => {
    const url = "https://px.a8.net/svt/ejp?a8mat=4B8097+2XZ6GI+424K+NTJWY";
    assert.equal(validateTrackingUrl(url, "a8", registry), null);
  });

  it("accepts ValueCommerce tracking URLs", () => {
    const url =
      "https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3776193&pid=892660854";
    assert.equal(validateTrackingUrl(url, "valuecommerce", registry), null);
  });

  it("rejects invented hosts", () => {
    const url = "https://evil.example/affiliate";
    assert.match(validateTrackingUrl(url, "a8", registry), /host must match/);
  });

  it("rejects substring host spoofing", () => {
    const url = "https://evilpx.a8.net/svt/ejp?a8mat=TEST";
    assert.match(validateTrackingUrl(url, "a8", registry), /host must match/);
  });

  it("rejects A8 URLs without a8mat", () => {
    const url = "https://px.a8.net/svt/ejp";
    assert.match(validateTrackingUrl(url, "a8", registry), /a8mat/);
  });
});

describe("validateAspProgramId", () => {
  it("validates A8 program IDs", () => {
    assert.equal(validateAspProgramId("4B8097+2XZ6GI+424K+NTJWY", "a8"), null);
    assert.match(validateAspProgramId("bad id", "a8"), /uppercase/);
  });

  it("validates ValueCommerce program IDs", () => {
    assert.equal(validateAspProgramId("892660854", "valuecommerce"), null);
    assert.match(validateAspProgramId("abc", "valuecommerce"), /numeric/);
  });
});

describe("inferProviderFromUrl", () => {
  it("infers provider from host", () => {
    assert.equal(
      inferProviderFromUrl("https://px.a8.net/svt/ejp?a8mat=TEST", registry),
      "a8",
    );
    assert.equal(
      inferProviderFromUrl(
        "https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=1&pid=2",
        registry,
      ),
      "valuecommerce",
    );
  });
});

describe("applyIntake", () => {
  it("updates an existing program entry", () => {
    const entry = {
      programKey: "uq-mobile",
      programId: "4B8097+TESTID+UQMO+BILE01",
      trackingUrl: "https://px.a8.net/svt/ejp?a8mat=4B8097+TESTID+UQMO+BILE01",
      provider: "a8",
      status: "active",
      label: "UQ mobile",
    };

    const { registry: next, changes } = applyIntake(registry, entry);
    const updated = next.programs["uq-mobile"];

    assert.ok(changes.includes("updatedAt"));
    assert.equal(updated.trackingUrl, entry.trackingUrl);
    assert.equal(updated.programId, entry.programId);
    assert.equal(updated.status, "active");
    assert.equal(updated.lastVerified, next.updatedAt);
  });

  it("extracts programId from tracking URL when omitted", () => {
    const entry = {
      programKey: "linemo",
      trackingUrl:
        "https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3776193&pid=892660854",
      provider: "valuecommerce",
    };

    const { registry: next } = applyIntake(registry, entry);
    assert.equal(next.programs.linemo.programId, "892660854");
  });

  it("rejects mismatched programId and trackingUrl", () => {
    assert.throws(
      () =>
        applyIntake(registry, {
          programKey: "linemo",
          programId: "111111111",
          trackingUrl:
            "https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3776193&pid=892660854",
          provider: "valuecommerce",
        }),
      /does not match trackingUrl/,
    );
  });
});

describe("buildProgramUrlIndex", () => {
  it("maps tracking URLs and program IDs to program keys", () => {
    const { byUrl, byProgramId } = buildProgramUrlIndex(registry);
    assert.equal(
      byUrl.get("https://px.a8.net/svt/ejp?a8mat=4B8097+2XZ6GI+424K+NTJWY"),
      "rakuten-mobile",
    );
    assert.equal(byProgramId.get("valuecommerce:892660854"), "linemo");
  });
});

describe("resolveProgramKeyFromUrl", () => {
  it("resolves known A8 and ValueCommerce URLs", () => {
    assert.equal(
      resolveProgramKeyFromUrl(
        "https://px.a8.net/svt/ejp?a8mat=4BB6H3+LGDU+4TIO+5YJRM",
        registry,
      ),
      "ahamo",
    );
    assert.equal(
      resolveProgramKeyFromUrl(
        "https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3776193&pid=892660854",
        registry,
      ),
      "linemo",
    );
  });
});

describe("migrateMarkdownLinks", () => {
  it("replaces ASP markdown links with affiliate placeholders", () => {
    const input =
      "[楽天モバイルの公式を見る](https://px.a8.net/svt/ejp?a8mat=4B8097+2XZ6GI+424K+NTJWY)";
    const { content, replacements, unmapped } = migrateMarkdownLinks(input, registry);

    assert.equal(content, "[楽天モバイルの公式を見る]({AFFILIATE:rakuten-mobile})");
    assert.equal(replacements.length, 1);
    assert.equal(unmapped.length, 0);
  });

  it("leaves official URLs unchanged", () => {
    const input = "[povoの公式を見る](https://povo.jp/)";
    const { content, replacements } = migrateMarkdownLinks(input, registry);
    assert.equal(content, input);
    assert.equal(replacements.length, 0);
  });
});

describe("findHardcodedAspUrls", () => {
  it("detects hardcoded ASP URLs but skips placeholder targets", () => {
    const content = [
      "[楽天](https://px.a8.net/svt/ejp?a8mat=4B8097+2XZ6GI+424K+NTJWY)",
      "[ahamo]({AFFILIATE:ahamo})",
    ].join("\n");
    const found = findHardcodedAspUrls(content, registry);
    assert.equal(found.length, 1);
    assert.equal(found[0].line, 1);
  });
});

describe("buildLastVerifiedAlert", () => {
  it("flags stale lastVerified dates for active programs", () => {
    const alert = buildLastVerifiedAlert(
      {
        status: "active",
        trackingUrl: "https://example.com",
        lastVerified: "2026-01-01",
      },
      "rakuten-mobile",
      30,
    );
    assert.equal(alert?.type, "stale-lastVerified");
  });

  it("skips pending programs without trackingUrl", () => {
    const alert = buildLastVerifiedAlert({ status: "pending" }, "uq-mobile", 30);
    assert.equal(alert, null);
  });
});

describe("daysSinceIsoDate", () => {
  it("computes day difference", () => {
    assert.equal(daysSinceIsoDate("2026-08-01", "2026-08-16"), 15);
  });
});

describe("probeTrackingUrl", () => {
  it("returns HTTP status from fetch", async () => {
    const fetchFn = async () => ({ ok: true, status: 200 });
    const result = await probeTrackingUrl("https://example.com", fetchFn);
    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
  });
});

describe("runAffiliateHealthCheck", () => {
  it("records probe failures and stale lastVerified alerts", async () => {
    const fetchFn = async () => ({ ok: false, status: 500 });
    const report = await runAffiliateHealthCheck(registry, {
      fetchFn,
      alertDays: 1,
      referenceDate: "2026-08-16",
    });

    assert.ok(report.summary.totalPrograms > 0);
    assert.ok(report.alerts.some((alert) => alert.type === "probe-failed"));
    assert.ok(report.alerts.some((alert) => alert.type === "stale-lastVerified"));
  });
});
