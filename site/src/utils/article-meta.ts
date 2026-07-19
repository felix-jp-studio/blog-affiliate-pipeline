import type { CollectionEntry } from "astro:content";

const CHARS_PER_MINUTE = 400;

function stripMarkdown(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~>|]/g, "")
    .replace(/\s+/g, "");
}

export function calculateReadingTime(
  body: string,
  overrideMinutes?: number,
): number {
  if (overrideMinutes !== undefined && overrideMinutes > 0) {
    return overrideMinutes;
  }
  const plain = stripMarkdown(body);
  return Math.max(1, Math.ceil(plain.length / CHARS_PER_MINUTE));
}

export function formatReadingTime(minutes: number): string {
  return `約${minutes}分`;
}

export function formatArticleDate(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export function getArticleExcerpt(
  description: string,
  excerpt?: string,
): string {
  return excerpt ?? description;
}

export function getReadingTimeForEntry(
  entry: CollectionEntry<"articles">,
): number {
  return calculateReadingTime(entry.body ?? "", entry.data.readingTime);
}
