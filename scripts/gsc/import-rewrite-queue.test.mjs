import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectCandidates, slugFromPageUrl } from "./import-rewrite-queue.mjs";

const articles = [
  {
    slug: "esim-profile-sakujo-dekinai-fix",
    draft: false,
    fields: { keyword: "esim プロファイル 削除できない" },
  },
  {
    slug: "nuro-hikari-tsunagaranai-fix",
    draft: false,
    fields: { keyword: "nuro光 繋がらない" },
  },
  {
    slug: "draft-only",
    draft: true,
    fields: { keyword: "下書き" },
  },
];

describe("import-rewrite-queue", () => {
  it("extracts article slug from GSC page URL", () => {
    assert.equal(
      slugFromPageUrl(
        "https://sim-hikari-guide.com/articles/esim-profile-sakujo-dekinai-fix",
      ),
      "esim-profile-sakujo-dekinai-fix",
    );
    assert.equal(
      slugFromPageUrl("/articles/nuro-hikari-tsunagaranai-fix/"),
      "nuro-hikari-tsunagaranai-fix",
    );
    assert.equal(slugFromPageUrl("https://sim-hikari-guide.com/"), "");
  });

  it("imports page rows in the 11–30 band and skips 34+", () => {
    const candidates = collectCandidates({
      gscRows: [
        {
          Page: "https://sim-hikari-guide.com/articles/esim-profile-sakujo-dekinai-fix",
          Clicks: "1",
          Impressions: "2",
          Position: "18.0",
        },
        {
          Page: "https://sim-hikari-guide.com/articles/nuro-hikari-tsunagaranai-fix",
          Clicks: "1",
          Impressions: "10",
          Position: "34.2",
        },
      ],
      queueRows: [],
      articles,
    });
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].slug, "esim-profile-sakujo-dekinai-fix");
    assert.equal(candidates[0].position, "18.0");
    assert.equal(candidates[0].notes, "GSC page 11-30位");
    assert.equal(candidates[0].status, "pending");
  });

  it("skips page rows whose slug is already in the queue", () => {
    const candidates = collectCandidates({
      gscRows: [
        {
          Page: "https://sim-hikari-guide.com/articles/esim-profile-sakujo-dekinai-fix",
          Position: "18.0",
        },
      ],
      queueRows: [
        {
          slug: "esim-profile-sakujo-dekinai-fix",
          query: "old",
          status: "done",
        },
      ],
      articles,
    });
    assert.equal(candidates.length, 0);
  });

  it("still matches query rows by keyword", () => {
    const candidates = collectCandidates({
      gscRows: [{ Query: "nuro光 繋がらない", Position: "22.4" }],
      queueRows: [],
      articles,
    });
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].slug, "nuro-hikari-tsunagaranai-fix");
    assert.equal(candidates[0].notes, "GSC 11-30位");
  });
});
