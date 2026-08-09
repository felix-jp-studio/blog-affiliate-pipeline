import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SIGN_IN_PAGE, isGoogleInterstitial404 } from "./playwright-browser.mjs";

describe("playwright browser helpers", () => {
  it("detects Google sign-in page copy", () => {
    assert.ok(SIGN_IN_PAGE.test("Sign in to continue to Google Search Console"));
    assert.ok(SIGN_IN_PAGE.test("https://accounts.google.com/signin/identifier"));
    assert.ok(SIGN_IN_PAGE.test("https://search.google.com/search-console/about"));
    assert.ok(SIGN_IN_PAGE.test("このブラウザまたはアプリは安全でない可能性があります"));
    assert.ok(!SIGN_IN_PAGE.test("URL Inspection tool"));
  });

  it("detects Google interstitial 404 but not GSC HTTP status text", () => {
    assert.ok(
      isGoogleInterstitial404(
        "404. エラーが発生しました。\nリクエストされた URL はこのサーバーで見つかりませんでした。その他の詳細は不明です。",
      ),
    );
    assert.ok(!isGoogleInterstitial404("ページの取得: 404 Not Found\nURL 検査"));
  });
});
