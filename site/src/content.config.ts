import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ base: "./src/content/articles", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    dateModified: z.coerce.date().optional(),
    category: z.enum(["sim", "hikari", "trouble", "cost"]),
    articleType: z.enum(["comparison", "howto", "troubleshoot", "crosssell"]),
    keyword: z.string(),
    priority: z.number().int().positive().optional(),
    draft: z.boolean().default(false),
    readingTime: z.number().optional(),
    excerpt: z.string().max(160).optional(),
    eyecatch: z.string().optional(),
    // 有料記事: 金額(JPY)を入れると本文の続きがペイウォールになる。
    // 有料本文そのものはリポジトリに置かず Vercel KV に保存する（本リポジトリは public）。
    paywallPrice: z.number().int().min(100).max(50000).optional(),
    paywallTeaser: z.string().max(200).optional(),
  }),
});

export const collections = { articles };
