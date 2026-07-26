import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import {
  markdownRemarkPlugins,
  markdownRehypePlugins,
} from "./src/markdown-plugins.ts";

export default defineConfig({
  site: "https://sim-hikari-guide.com",
  trailingSlash: "never",
  output: "static",
  adapter: vercel(),
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: markdownRemarkPlugins,
    rehypePlugins: markdownRehypePlugins,
  },
});
