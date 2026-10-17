#!/usr/bin/env node
/**
 * Re-select the homepage "おすすめ記事" (2 per category) from the last weeks of
 * GSC page CSVs and rewrite site/src/data/home-featured.ts.
 *
 * Usage:
 *   node scripts/update-home-featured.mjs
 *   node scripts/update-home-featured.mjs --weeks=4 --dry-run
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hubArticleMesh } from "../site/src/data/hub-article-mesh.ts";
import { homeFeaturedSlugs } from "../site/src/data/home-featured.ts";
import { loadPublishedArticles, repoRoot } from "./e2e/e2e-utils.mjs";
import {
  aggregatePageMetrics,
  latestPagesCsvNames,
  renderHomeFeaturedModule,
  selectHomeFeatured,
} from "./home-featured/select.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const weeks = Number.parseInt(
  args.find((arg) => arg.startsWith("--weeks="))?.slice("--weeks=".length) ?? "4",
  10,
);

const dataDir = join(repoRoot, "data");
const outputPath = join(repoRoot, "site/src/data/home-featured.ts");

const sources = latestPagesCsvNames(readdirSync(dataDir), weeks);
const metrics = aggregatePageMetrics(
  sources.map((name) => readFileSync(join(dataDir, name), "utf8")),
);
const publishedSlugs = new Set(
  loadPublishedArticles()
    .filter((article) => !article.error && !article.draft)
    .map((article) => article.slug),
);

const picks = selectHomeFeatured({
  mesh: hubArticleMesh,
  publishedSlugs,
  metrics,
  previous: homeFeaturedSlugs,
});

const updatedAt = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
  new Date(),
);
const content = renderHomeFeaturedModule({ picks, updatedAt, sources });

console.log(`update-home-featured: based on ${sources.join(", ") || "no GSC data"}`);
for (const [category, slugs] of Object.entries(picks)) {
  const before = homeFeaturedSlugs[category] ?? [];
  const changed = slugs.join() !== before.join() ? " (changed)" : "";
  const detail = slugs.map((slug) => {
    const m = metrics.get(slug);
    return m
      ? `${slug} [${m.clicks} clicks / ${m.impressions} imp]`
      : `${slug} [no data]`;
  });
  console.log(`  ${category}: ${detail.join(", ")}${changed}`);
}

if (dryRun) {
  console.log("update-home-featured: dry-run, not written");
} else {
  writeFileSync(outputPath, content, "utf8");
  console.log(`update-home-featured: wrote ${outputPath}`);
}
