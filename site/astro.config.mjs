import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { rehypeAffiliateAndTables } from "./src/plugins/rehype-affiliate-tables.ts";
import { rehypeHeadings } from "./src/plugins/rehype-headings.ts";

export default defineConfig({
  site: "https://sim-hikari-guide.com",
  trailingSlash: "never",
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeHeadings, rehypeAffiliateAndTables],
  },
});
