import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../lib/csv.mjs";
import {
  REWRITE_QUEUE_HEADERS,
  markRowDone,
  markRowStatus,
  parseQueue,
  pendingRows,
  selectNextPending,
  serializeQueue,
  withDateModified,
} from "./queue.mjs";

describe("csv helpers", () => {
  it("parses headers and rows, trimming and padding short lines", () => {
    const { headers, rows } = parseCsv("a, b, c\n1, 2\n");
    assert.deepEqual(headers, ["a", "b", "c"]);
    assert.deepEqual(rows, [{ a: "1", b: "2", c: "" }]);
  });

  it("skips comment lines only when asked", () => {
    assert.equal(parseCsv("# note\na\n1\n").headers[0], "# note");
    assert.equal(parseCsv("# note\na\n1\n", { skipComments: true }).headers[0], "a");
  });
});

describe("rewrite queue", () => {
  const csv = [
    "slug,query,position,priority,status,notes",
    "alpha,q1,12,3,done,",
    "bravo,q2,8,2,,",
    "charlie,q3,9,1,pending,",
    "delta,q4,7,,pending,",
  ].join("\n");

  it("round-trips the queue csv", () => {
    const { headers, rows } = parseQueue(csv);
    assert.deepEqual(headers, REWRITE_QUEUE_HEADERS);
    assert.equal(serializeQueue(headers, rows), `${csv}\n`);
  });

  it("falls back to the canonical headers when the file is empty", () => {
    assert.deepEqual(parseQueue("").headers, REWRITE_QUEUE_HEADERS);
  });

  it("treats blank status as pending and sorts by priority", () => {
    const { rows } = parseQueue(csv);
    assert.deepEqual(
      pendingRows(rows).map((row) => row.slug),
      ["charlie", "bravo", "delta"],
    );
    assert.equal(selectNextPending(rows).slug, "charlie");
  });

  it("returns null when nothing is pending", () => {
    const { rows } = parseQueue("slug,status\nalpha,done\n");
    assert.equal(selectNextPending(rows), null);
  });

  it("marks only the matching slug as done", () => {
    const { rows } = parseQueue(csv);
    const updated = markRowDone(rows, "bravo");
    assert.equal(updated.find((row) => row.slug === "bravo").status, "done");
    assert.equal(updated.find((row) => row.slug === "charlie").status, "pending");
    assert.equal(rows.find((row) => row.slug === "bravo").status, "");
  });
});

describe("withDateModified", () => {
  it("replaces an existing dateModified", () => {
    const text = "---\ntitle: t\ndateModified: 2026-01-01\n---\nbody\n";
    assert.match(withDateModified(text, "2026-09-13"), /dateModified: 2026-09-13/);
  });

  it("appends dateModified when absent", () => {
    const text = "---\ntitle: t\n---\nbody\n";
    assert.equal(
      withDateModified(text, "2026-09-13"),
      "---\ntitle: t\ndateModified: 2026-09-13\n---\nbody\n",
    );
  });

  it("returns null when the date is unchanged", () => {
    const text = "---\ndateModified: 2026-09-13\n---\nbody\n";
    assert.equal(withDateModified(text, "2026-09-13"), null);
  });

  it("throws when frontmatter is missing", () => {
    assert.throws(() => withDateModified("body only\n", "2026-09-13"));
  });
});

describe("markRowStatus", () => {
  const rows = [
    { slug: "a", status: "pending", notes: "" },
    { slug: "b", status: "pending", notes: "keep" },
  ];

  it("メタ変更がない行は done ではなく skipped にする", () => {
    const out = markRowStatus(rows, "a", "skipped", "meta already matches template");
    assert.equal(out[0].status, "skipped");
    assert.equal(out[0].notes, "meta already matches template");
  });

  it("対象外の行は変更しない", () => {
    const out = markRowStatus(rows, "a", "skipped", "x");
    assert.deepEqual(out[1], rows[1]);
  });

  it("notes を省略すると既存の notes を保持する", () => {
    const out = markRowStatus(rows, "b", "skipped");
    assert.equal(out[1].status, "skipped");
    assert.equal(out[1].notes, "keep");
  });

  it("markRowDone は done を設定し notes を触らない", () => {
    const out = markRowDone(rows, "b");
    assert.equal(out[1].status, "done");
    assert.equal(out[1].notes, "keep");
  });

  it("skipped は pending として再選択されない", () => {
    const out = markRowStatus(rows, "a", "skipped", "x");
    assert.deepEqual(
      pendingRows(out).map((r) => r.slug),
      ["b"],
    );
  });
});
