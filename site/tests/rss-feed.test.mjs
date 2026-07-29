import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rssSource = readFileSync(
  join(__dirname, "../src/pages/rss.xml.ts"),
  "utf8",
);

describe("rss feed endpoint", () => {
  it("exports GET handler and RSS 2.0 channel fields", () => {
    assert.match(rssSource, /export const GET/);
    assert.match(rssSource, /version="2\.0"/);
    assert.match(rssSource, /<title>/);
    assert.match(rssSource, /<pubDate>/);
    assert.match(rssSource, /<description>/);
    assert.match(rssSource, /FEED_LIMIT = 20/);
  });
});
