import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractCandidateUrls, parseAspPaste } from "./parse-asp-paste.mjs";
import { readAspUrls } from "./lib.mjs";

const registry = readAspUrls();

const A8_URL = "https://px.a8.net/svt/ejp?a8mat=4B8097+TESTID+UQMO+BILE01";
const VC_URL =
  "https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3776193&pid=892660854";

describe("extractCandidateUrls", () => {
  it("extracts URLs from plain text", () => {
    const urls = extractCandidateUrls(`Link: ${A8_URL} end`);
    assert.equal(urls.length, 1);
    assert.equal(urls[0], A8_URL);
  });

  it("extracts href from HTML snippets", () => {
    const html = `<a href="${A8_URL}">UQ mobile</a>`;
    const urls = extractCandidateUrls(html);
    assert.equal(urls[0], A8_URL);
  });

  it("deduplicates repeated URLs", () => {
    const urls = extractCandidateUrls(`${A8_URL}\n${A8_URL}`);
    assert.equal(urls.length, 1);
  });
});

describe("parseAspPaste", () => {
  it("parses A8 tracking URL with programId", () => {
    const parsed = parseAspPaste(A8_URL, registry);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].provider, "a8");
    assert.equal(parsed[0].programId, "4B8097+TESTID+UQMO+BILE01");
  });

  it("parses ValueCommerce URL from HTML", () => {
    const html = `<p><a href="${VC_URL}">LINEMO</a></p>`;
    const parsed = parseAspPaste(html, registry);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].provider, "valuecommerce");
    assert.equal(parsed[0].programId, "892660854");
  });

  it("ignores non-ASP URLs", () => {
    const parsed = parseAspPaste("https://povo.jp/ and https://evil.example/", registry);
    assert.equal(parsed.length, 0);
  });

  it("ignores invalid A8 URLs without a8mat", () => {
    const parsed = parseAspPaste("https://px.a8.net/svt/ejp", registry);
    assert.equal(parsed.length, 0);
  });
});
