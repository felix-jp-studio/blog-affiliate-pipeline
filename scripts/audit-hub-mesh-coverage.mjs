/**
 * Audit that every published article appears in hub-article-mesh featured lists.
 *
 * Usage:
 *   node scripts/audit-hub-mesh-coverage.mjs
 *   node scripts/audit-hub-mesh-coverage.mjs --json
 */
import { hubArticleMesh } from "../site/src/data/hub-article-mesh.ts";
import { loadPublishedArticles } from "./e2e/e2e-utils.mjs";

const asJson = process.argv.includes("--json");

const meshSlugs = new Set();
for (const mesh of Object.values(hubArticleMesh)) {
  for (const item of mesh.featured) {
    meshSlugs.add(item.slug);
  }
}

const published = loadPublishedArticles().filter((article) => !article.draft);
const missing = published
  .filter((article) => !meshSlugs.has(article.slug))
  .map((article) => ({
    slug: article.slug,
    category: article.fields.category ?? "?",
  }))
  .sort((a, b) => a.slug.localeCompare(b.slug));

const summary = {
  published: published.length,
  meshSlugs: meshSlugs.size,
  missingCount: missing.length,
  missing,
};

if (asJson) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(missing.length === 0 ? 0 : 1);
}

console.log(
  `hub-mesh-audit: ${summary.published} published, ${summary.meshSlugs} in mesh, ${summary.missingCount} missing`,
);

if (missing.length === 0) {
  console.log("All published articles are listed in hub mesh.");
  process.exit(0);
}

console.log("\nMissing from hub mesh:");
for (const entry of missing) {
  console.log(`  ${entry.slug} (${entry.category})`);
}
process.exit(1);
