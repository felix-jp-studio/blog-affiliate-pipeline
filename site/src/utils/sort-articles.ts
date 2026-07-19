import type { CollectionEntry } from "astro:content";

export function compareArticlesByRecency(
  a: CollectionEntry<"articles">,
  b: CollectionEntry<"articles">,
): number {
  const dateDiff = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  if (dateDiff !== 0) {
    return dateDiff;
  }

  const priorityA = a.data.priority ?? 0;
  const priorityB = b.data.priority ?? 0;
  if (priorityA !== priorityB) {
    return priorityB - priorityA;
  }

  return b.id.localeCompare(a.id);
}
