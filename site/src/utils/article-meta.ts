import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import type { CollectionEntry } from "astro:content";
import type { CategorySlug } from "../data/category-meta";
import { categoryMeta } from "../data/category-meta";
import { markdownRehypePlugins } from "../markdown-plugins";

const CHARS_PER_MINUTE = 400;

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

let processorPromise: ReturnType<typeof createMarkdownProcessor> | null = null;

async function getMarkdownProcessor() {
  if (!processorPromise) {
    processorPromise = createMarkdownProcessor({
      markdown: {
        rehypePlugins: markdownRehypePlugins,
      },
    });
  }

  return processorPromise;
}

export async function extractHeadings(body: string): Promise<TocItem[]> {
  const processor = await getMarkdownProcessor();
  const { metadata } = await processor.render(body);

  return metadata.headings
    .filter((heading) => heading.depth === 2 || heading.depth === 3)
    .map((heading) => ({
      id: heading.slug,
      text: heading.text,
      level: heading.depth as 2 | 3,
    }));
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

export function resolveEyecatchUrl(
  eyecatch: string | undefined,
  category: CategorySlug,
): string | undefined {
  return eyecatch;
}

export function resolveOgImageUrl(
  eyecatch: string | undefined,
  category: CategorySlug,
): string {
  return eyecatch ?? categoryMeta[category].ogImage;
}
