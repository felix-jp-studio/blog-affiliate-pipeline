import type { CollectionEntry } from "astro:content";
import { nextHeadingId } from "./heading-slug";

const CHARS_PER_MINUTE = 400;

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*|__/g, "")
    .replace(/\*|_/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

export function extractHeadings(body: string): TocItem[] {
  const items: TocItem[] = [];
  const slugCounts = new Map<string, number>();
  let inCodeBlock = false;

  for (const line of body.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    if (level !== 2 && level !== 3) {
      continue;
    }

    const text = stripInlineMarkdown(match[2]);
    const id = nextHeadingId(text, slugCounts);

    items.push({ id, text, level: level as 2 | 3 });
  }

  return items;
}

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
