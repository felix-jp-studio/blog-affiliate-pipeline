import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadPending, markIndexed, patchQueueEntry, queueStats } from "./queue.mjs";

function makeQueue(entries) {
  return { updatedAt: "2026-01-01T00:00:00.000Z", entries };
}

describe("gsc queue", () => {
  it("computes queue stats", () => {
    const weekAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const old = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const stats = queueStats([
      { slug: "a", indexed: true, mergedAt: weekAgo },
      { slug: "b", indexed: false, mergedAt: weekAgo },
      { slug: "c", indexed: false, mergedAt: old },
    ]);
    assert.equal(stats.total, 3);
    assert.equal(stats.indexed, 1);
    assert.equal(stats.pending, 2);
    assert.equal(stats.pendingThisWeek, 1);
  });

  it("loads pending entries oldest first", () => {
    const pending = loadPending([
      { slug: "newer", indexed: false, mergedAt: "2026-08-10T00:00:00.000Z" },
      { slug: "older", indexed: false, mergedAt: "2026-08-01T00:00:00.000Z" },
      { slug: "done", indexed: true, mergedAt: "2026-08-01T00:00:00.000Z" },
    ]);
    assert.deepEqual(
      pending.map((entry) => entry.slug),
      ["older", "newer"],
    );
  });

  it("loads pending entries with week-first ordering", () => {
    const weekAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const old = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const pending = loadPending(
      [
        { slug: "old-pending", indexed: false, mergedAt: old },
        { slug: "new-pending", indexed: false, mergedAt: weekAgo },
      ],
      { weekFirst: true },
    );
    assert.equal(pending[0].slug, "new-pending");
    assert.equal(pending[0].mergedThisWeek, true);
    assert.equal(pending[1].slug, "old-pending");
    assert.equal(pending[1].mergedThisWeek, false);
  });

  it("patches a queue entry by slug", () => {
    const queue = makeQueue([{ slug: "foo", indexed: false }]);
    assert.equal(patchQueueEntry(queue, "foo", { note: "checked" }), true);
    assert.equal(queue.entries[0].note, "checked");
    assert.equal(patchQueueEntry(queue, "missing", { note: "x" }), false);
  });

  it("marks slugs indexed without touching already indexed entries", () => {
    const queue = makeQueue([
      { slug: "a", indexed: false },
      { slug: "b", indexed: true, indexedAt: "2026-01-01T00:00:00.000Z" },
      { slug: "c", indexed: false },
    ]);
    const updated = markIndexed(queue, [" a ", "b", "c", ""]);
    assert.equal(updated, 2);
    assert.equal(queue.entries[0].indexed, true);
    assert.match(queue.entries[0].indexedAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(queue.entries[1].indexedAt, "2026-01-01T00:00:00.000Z");
    assert.equal(queue.entries[2].indexed, true);
  });
});
