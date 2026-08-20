/**
 * Shared helpers for data/gsc-index-queue.json.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";

export const queuePath = join(repoRoot, "data/gsc-index-queue.json");

export function todayJstDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function loadQueue() {
  if (!existsSync(queuePath)) {
    throw new Error(`queue file not found: ${queuePath}`);
  }

  const queue = JSON.parse(readFileSync(queuePath, "utf8"));
  if (!Array.isArray(queue.entries)) {
    throw new Error("gsc-index-queue.json: entries must be an array");
  }
  return queue;
}

export function writeQueue(queue) {
  queue.updatedAt = new Date().toISOString();
  writeFileSync(queuePath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
}

export function queueStats(entries) {
  const pending = entries.filter((entry) => entry.indexed === false);
  const indexed = entries.filter((entry) => entry.indexed === true);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const pendingThisWeek = pending.filter(
    (entry) => new Date(entry.mergedAt).getTime() >= weekAgo,
  );
  return {
    total: entries.length,
    pending: pending.length,
    indexed: indexed.length,
    pendingThisWeek: pendingThisWeek.length,
  };
}

export function loadPending(entries, { weekFirst = false } = {}) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const pending = entries
    .filter((entry) => entry.indexed === false)
    .map((entry) => ({
      ...entry,
      mergedThisWeek: new Date(entry.mergedAt).getTime() >= weekAgo,
    }));

  if (weekFirst) {
    return pending.sort((a, b) => {
      if (a.mergedThisWeek !== b.mergedThisWeek) {
        return a.mergedThisWeek ? -1 : 1;
      }
      return new Date(a.mergedAt) - new Date(b.mergedAt);
    });
  }

  return pending.sort((a, b) => new Date(a.mergedAt) - new Date(b.mergedAt));
}

/**
 * @param {ReturnType<typeof loadQueue>} queue
 * @param {string} slug
 * @param {Record<string, unknown>} patch
 */
export function patchQueueEntry(queue, slug, patch) {
  const entry = queue.entries.find((item) => item.slug === slug);
  if (!entry) {
    return false;
  }
  Object.assign(entry, patch);
  return true;
}

/**
 * Mark slugs as indexed in an in-memory queue object.
 * @param {ReturnType<typeof loadQueue>} queue
 * @param {string[]} slugs
 * @returns {number} count of entries updated
 */
export function markIndexed(queue, slugs) {
  const slugSet = new Set(slugs.map((slug) => slug.trim()).filter(Boolean));
  const now = new Date().toISOString();
  let updated = 0;

  for (const entry of queue.entries) {
    if (slugSet.has(entry.slug) && entry.indexed !== true) {
      entry.indexed = true;
      entry.indexedAt = now;
      updated += 1;
    }
  }

  return updated;
}
