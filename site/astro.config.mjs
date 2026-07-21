import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import {
  markdownRemarkPlugins,
  markdownRehypePlugins,
} from "./src/markdown-plugins.ts";

export default defineConfig({
  site: "https://sim-hikari-guide.com",
  trailingSlash: "never",
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: markdownRemarkPlugins,
    rehypePlugins: markdownRehypePlugins,
  },
});
