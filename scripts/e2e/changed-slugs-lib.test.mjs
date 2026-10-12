import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_SHA,
  articlePathsFromDiff,
  formatSlugs,
  parseArgs,
  resolveRange,
  selectOutputSlugs,
  slugsFromPaths,
} from "./changed-slugs-lib.mjs";

const EVENT = "/event.json";

describe("changed-slugs args and range", () => {
  it("parses the flags and defaults to lines with the fallback on", () => {
    const bare = { format: "lines", base: undefined, head: undefined, noFallback: false };
    assert.deepEqual(parseArgs([]), bare);
    assert.deepEqual(
      parseArgs(["--format=json", "--base=origin/main", "--head=HEAD", "--no-fallback"]),
      { format: "json", base: "origin/main", head: "HEAD", noFallback: true },
    );
    assert.equal(parseArgs(["--base=refs/heads/x=y"]).base, "refs/heads/x=y");
  });

  it("reads the range from flags, then the pull_request or push payload", () => {
    const pr = { pull_request: { base: { sha: "base-sha" }, head: { sha: "head-sha" } } };
    assert.deepEqual(
      resolveRange({ base: "a", head: "b" }, { GITHUB_EVENT_NAME: "pull_request" }),
      { base: "a", head: "b" },
    );
    assert.deepEqual(
      resolveRange(
        {},
        { GITHUB_EVENT_NAME: "pull_request", GITHUB_EVENT_PATH: EVENT },
        () => pr,
      ),
      { base: "base-sha", head: "head-sha" },
    );
    assert.deepEqual(
      resolveRange({}, { GITHUB_EVENT_NAME: "push", GITHUB_EVENT_PATH: EVENT }, () => ({
        before: "old",
        after: "new",
      })),
      { base: "old", head: "new" },
    );
  });

  it("falls back for a half-range, a parentless push, or no event", () => {
    const fallback = { base: "origin/main", head: "HEAD" };
    assert.deepEqual(resolveRange({ base: "a" }, {}), fallback);
    assert.deepEqual(resolveRange({}, {}), fallback);
    assert.deepEqual(
      resolveRange({}, { GITHUB_EVENT_NAME: "push", GITHUB_EVENT_PATH: EVENT }, () => ({
        before: EMPTY_SHA,
        after: "new",
      })),
      fallback,
    );
    assert.deepEqual(resolveRange({}, { GITHUB_BASE_REF: "main", GITHUB_SHA: "sha" }), {
      base: "main",
      head: "sha",
    });
  });
});

describe("changed-slugs output", () => {
  it("keeps only article markdown paths", () => {
    const diff = [
      "site/src/content/articles/sim-20gb-osusume.md",
      "  site/src/content/articles/hikari-hikaku.md  ",
      "site/src/content/articles/draft.txt",
      "site/src/components/Breadcrumbs.astro",
      "",
    ].join("\n");
    assert.deepEqual(articlePathsFromDiff(diff), [
      "site/src/content/articles/sim-20gb-osusume.md",
      "site/src/content/articles/hikari-hikaku.md",
    ]);
  });

  it("maps paths to unique slugs", () => {
    const dir = "site/src/content/articles";
    assert.deepEqual(slugsFromPaths([`${dir}/a.md`, `${dir}/a.md`, `${dir}/b.md`]), [
      "a",
      "b",
    ]);
  });

  it("prefers changed slugs, else the smoke fallback unless disabled", () => {
    assert.deepEqual(selectOutputSlugs(["a"], { fallbackSlugs: ["smoke"] }), ["a"]);
    assert.deepEqual(selectOutputSlugs([], { fallbackSlugs: ["smoke"] }), ["smoke"]);
    assert.deepEqual(
      selectOutputSlugs([], { noFallback: true, fallbackSlugs: ["smoke"] }),
      [],
    );
  });

  it("formats each output shape, defaulting to lines", () => {
    const slugs = ["a", "b"];
    assert.equal(formatSlugs(slugs, "lines"), "a\nb\n");
    assert.equal(formatSlugs(slugs, "comma"), "a,b");
    assert.equal(formatSlugs(slugs, "env"), "E2E_SMOKE_SLUGS=a,b");
    assert.equal(formatSlugs(slugs, "json"), '["a","b"]');
    assert.equal(formatSlugs(slugs, "yaml"), "a\nb\n");
  });

  it("emits nothing for an empty slug list", () => {
    assert.equal(formatSlugs([], "lines"), "");
    assert.equal(formatSlugs([], "json"), "[]");
    assert.deepEqual(articlePathsFromDiff(""), []);
  });
});
