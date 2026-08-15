import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyIntake,
  inferProviderFromUrl,
  readAspUrls,
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
