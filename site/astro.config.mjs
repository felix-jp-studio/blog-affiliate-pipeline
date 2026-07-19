import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { rehypeAffiliateAndTables } from "./src/plugins/rehype-affiliate-tables.ts";

export default defineConfig({
  site: "https://sim-hikari-guide.com",
  trailingSlash: "never",
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeAffiliateAndTables],
  },
});
