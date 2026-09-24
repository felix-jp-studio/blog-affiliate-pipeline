/**
 * Pure helpers for data/rewrite-queue.csv and article frontmatter updates.
 * Kept free of fs/process access so they can be unit tested.
 */
import { parseCsv, serializeCsv } from "../lib/csv.mjs";

const HEADERS = "slug,query,position,priority,status,notes";
export const REWRITE_QUEUE_HEADERS = HEADERS.split(",");

export function parseQueue(text) {
  return parseCsv(text, { defaultHeaders: REWRITE_QUEUE_HEADERS });
}

export function serializeQueue(headers, rows) {
  return serializeCsv(headers, rows);
}

/** Pending rows sorted by priority (missing priority sorts last). */
export function pendingRows(rows) {
  return rows
    .filter((row) => {
      const status = (row.status ?? "").toLowerCase();
      return status === "" || status === "pending";
    })
    .sort((a, b) => Number(a.priority || 999) - Number(b.priority || 999));
}

export function selectNextPending(rows) {
  return pendingRows(rows)[0] ?? null;
}

export function markRowDone(rows, slug) {
  return markRowStatus(rows, slug, "done");
}

/**
 * 行のステータスを更新する。
 *
 * メタが既にテンプレートと一致していて書き換えが発生しない場合は "skipped" を使う。
 * "done" にすると「リライトした」ことになってしまい、実態と合わない。
 */
export function markRowStatus(rows, slug, status, notes) {
  return rows.map((row) =>
    row.slug === slug
      ? { ...row, status, ...(notes === undefined ? {} : { notes }) }
      : row,
  );
}

/**
 * Set `dateModified` in an article's frontmatter block.
 * Returns null when already up to date, and throws when frontmatter is missing.
 */
export function withDateModified(text, today) {
  const frontmatterMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    throw new Error("frontmatter missing");
  }

  const frontmatter = frontmatterMatch[1];
  const updated = /^dateModified:/m.test(frontmatter)
    ? frontmatter.replace(/^dateModified:.*$/m, `dateModified: ${today}`)
    : `${frontmatter}\ndateModified: ${today}`;

  if (updated === frontmatter) {
    return null;
  }
  return text.replace(frontmatter, updated);
}
