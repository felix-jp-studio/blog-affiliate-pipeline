import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { siteUrlCandidates, siteUrlFromEnv } from "./auth.mjs";

describe("auth siteUrl", () => {
  it("preserves sc-domain without trailing slash", () => {
    const prev = process.env.GSC_SITE_URL;
    process.env.GSC_SITE_URL = "sc-domain:sim-hikari-guide.com";
    assert.equal(siteUrlFromEnv(), "sc-domain:sim-hikari-guide.com");
    process.env.GSC_SITE_URL = prev;
  });

  it("returns url-prefix and sc-domain candidates", () => {
    const prev = process.env.GSC_SITE_URL;
    process.env.GSC_SITE_URL = "https://sim-hikari-guide.com/";
    const candidates = siteUrlCandidates();
    assert.ok(candidates.includes("https://sim-hikari-guide.com/"));
    assert.ok(candidates.includes("sc-domain:sim-hikari-guide.com"));
    process.env.GSC_SITE_URL = prev;
  });
});

describe("playwright storage parsing", () => {
  it("accepts raw JSON env value", async () => {
    const { loadPlaywrightStorageState } = await import("./playwright-storage.mjs");
    const prev = process.env.GSC_PLAYWRIGHT_STORAGE_STATE;
    process.env.GSC_PLAYWRIGHT_STORAGE_STATE = '{"cookies":[],"origins":[]}';
    assert.deepEqual(loadPlaywrightStorageState(), { cookies: [], origins: [] });
    process.env.GSC_PLAYWRIGHT_STORAGE_STATE = prev;
  });

  it("accepts base64 JSON env value", async () => {
    const { loadPlaywrightStorageState } = await import("./playwright-storage.mjs");
    const prev = process.env.GSC_PLAYWRIGHT_STORAGE_STATE;
    const json = '{"cookies":[],"origins":[]}';
    process.env.GSC_PLAYWRIGHT_STORAGE_STATE = Buffer.from(json).toString("base64");
    assert.deepEqual(loadPlaywrightStorageState(), { cookies: [], origins: [] });
    process.env.GSC_PLAYWRIGHT_STORAGE_STATE = prev;
  });
});
