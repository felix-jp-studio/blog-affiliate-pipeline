import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://sim-hikari-guide.com",
  trailingSlash: "never",
  integrations: [sitemap()],
});
