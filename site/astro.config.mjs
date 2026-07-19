import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { markdownRehypePlugins } from "./src/markdown-plugins.ts";

export default defineConfig({
  site: "https://sim-hikari-guide.com",
  trailingSlash: "never",
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: markdownRehypePlugins,
  },
});
