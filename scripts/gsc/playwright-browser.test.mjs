import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SIGN_IN_PAGE } from "./playwright-browser.mjs";

describe("playwright browser helpers", () => {
  it("detects Google sign-in page copy", () => {
    assert.ok(SIGN_IN_PAGE.test("Sign in to continue to Google Search Console"));
    assert.ok(SIGN_IN_PAGE.test("https://accounts.google.com/signin/identifier"));
    assert.ok(!SIGN_IN_PAGE.test("URL Inspection tool"));
  });
});
