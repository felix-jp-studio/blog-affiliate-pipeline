import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ base: "./src/content/articles", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.enum(["sim", "hikari", "trouble", "cost"]),
    articleType: z.enum(["comparison", "howto", "troubleshoot", "crosssell"]),
    keyword: z.string(),
    priority: z.number().int().positive().optional(),
    draft: z.boolean().default(false),
    readingTime: z.number().optional(),
    excerpt: z.string().max(160).optional(),
    eyecatch: z.string().optional(),
  }),
});

export const collections = { articles };
