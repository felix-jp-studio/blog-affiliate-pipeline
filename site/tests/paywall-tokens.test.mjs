import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildBuyerCookie,
  createBuyerToken,
  newBuyerId,
  newRestoreCode,
  normalizeRestoreCode,
  readBuyerToken,
  readCookie,
} from "../src/lib/paywall/tokens.ts";

const SECRET = "test-secret-value";

test("署名した購入者トークンは同じ秘密鍵で復元できる", () => {
  const buyerId = newBuyerId();
  const token = createBuyerToken(buyerId, SECRET);
  assert.equal(readBuyerToken(token, SECRET), buyerId);
});

test("別の秘密鍵で署名されたトークンは拒否する", () => {
  const token = createBuyerToken(newBuyerId(), "another-secret");
  assert.equal(readBuyerToken(token, SECRET), null);
});

test("購入者 ID を書き換えたトークンは拒否する", () => {
  const token = createBuyerToken(newBuyerId(), SECRET);
  const [, signature] = token.split(".");
  assert.equal(readBuyerToken(`tampered.${signature}`, SECRET), null);
});

test("形式が壊れたトークンは拒否する", () => {
  for (const token of [undefined, null, "", "nodot", ".onlysig", "id."]) {
    assert.equal(readBuyerToken(token, SECRET), null);
  }
});

test("復元コードは 4 文字 3 ブロックで、正規化すると 12 文字になる", () => {
  const code = newRestoreCode();
  assert.match(code, /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.equal(normalizeRestoreCode(code).length, 12);
  assert.equal(
    normalizeRestoreCode(code.toLowerCase()),
    normalizeRestoreCode(code),
  );
});

test("復元コードは紛らわしい文字を含まない", () => {
  for (let i = 0; i < 50; i += 1) {
    assert.doesNotMatch(newRestoreCode(), /[OI01]/);
  }
});

test("購入者 cookie は HttpOnly / Secure / SameSite=Lax で発行する", () => {
  const cookie = buildBuyerCookie("token-value", 100, "pw_buyer");
  assert.match(cookie, /^pw_buyer=token-value;/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Max-Age=100/);
});

test("cookie ヘッダーから目的の値だけを取り出す", () => {
  assert.equal(readCookie("a=1; pw_buyer=xyz; b=2", "pw_buyer"), "xyz");
  assert.equal(readCookie("pw_buyer_other=xyz", "pw_buyer"), null);
  assert.equal(readCookie(null, "pw_buyer"), null);
});
