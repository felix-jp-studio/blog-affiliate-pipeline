import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ base: "./src/content/articles", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.enum(["sim", "hikari", "trouble"]),
    articleType: z.enum(["comparison", "howto", "troubleshoot"]),
    keyword: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
