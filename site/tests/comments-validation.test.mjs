import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeCommentText,
  validateCommentInput,
} from "../src/lib/comments/validation.ts";

describe("validateCommentInput", () => {
  it("accepts valid input", () => {
    assert.equal(
      validateCommentInput({
        articleSlug: "sim-20gb-osusume",
        authorName: "テスト",
        body: "1234567890",
      }),
      null,
    );
  });

  it("rejects invalid slug", () => {
    assert.match(
      validateCommentInput({
        articleSlug: "../evil",
        authorName: "テスト",
        body: "1234567890",
      }) ?? "",
      /不正/,
    );
  });

  it("rejects short body", () => {
    assert.match(
      validateCommentInput({
        articleSlug: "sim-20gb-osusume",
        authorName: "テスト",
        body: "short",
      }) ?? "",
      /10/,
    );
  });
});

describe("sanitizeCommentText", () => {
  it("trims and collapses whitespace", () => {
    assert.equal(sanitizeCommentText("  hello   world  "), "hello world");
  });
});
