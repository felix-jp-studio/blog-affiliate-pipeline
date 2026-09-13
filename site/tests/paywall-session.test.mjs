import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidSlug, resolveOrigin } from "../src/lib/paywall/session.ts";

test("記事 slug の形式だけを受け付ける", () => {
  assert.ok(isValidSlug("ahamo-esim-settei-tejun"));
  assert.ok(isValidSlug("5g-sim-speed-hikaku"));

  for (const invalid of [
    "",
    "Upper-Case",
    "trailing-",
    "-leading",
    "double--hyphen",
    "../etc/passwd",
    "slug with space",
    "a".repeat(121),
    123,
    null,
  ]) {
    assert.equal(isValidSlug(invalid), false, `expected reject: ${invalid}`);
  }
});

test("オリジンはサイト設定を優先し、無ければリクエスト URL から取る", () => {
  const request = new Request(
    "https://preview.example.com/api/paywall/checkout",
  );
  assert.equal(
    resolveOrigin(new URL("https://sim-hikari-guide.com"), request, false),
    "https://sim-hikari-guide.com",
  );
  assert.equal(
    resolveOrigin(undefined, request, false),
    "https://preview.example.com",
  );
});

test("dev サーバーでは決済後に localhost へ戻す", () => {
  const request = new Request("http://localhost:4321/api/paywall/checkout");
  assert.equal(
    resolveOrigin(new URL("https://sim-hikari-guide.com"), request, true),
    "http://localhost:4321",
  );
});
