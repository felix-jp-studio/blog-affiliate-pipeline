/**
 * Audit inbound internal links to /articles/{slug} across markdown bodies and hub mesh.
 *
 * Usage:
 *   node scripts/audit-orphan-articles.mjs
 *   node scripts/audit-orphan-articles.mjs --json
 *   node scripts/audit-orphan-articles.mjs --min-inbound=2
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listArticleFiles, loadPublishedArticles, repoRoot } from "./e2e/e2e-utils.mjs";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const minInboundArg = args.find((arg) => arg.startsWith("--min-inbound="));
const minInbound = minInboundArg
  ? Number.parseInt(minInboundArg.slice("--min-inbound=".length), 10)
  : 1;
const ARTICLE_LINK_RE = /\/articles\/([a-z0-9-]+)/g;

function countInboundFromArticles() {
  const inbound = new Map();

  for (const filePath of listArticleFiles()) {
    const slug = filePath.split("/").pop().replace(/\.md$/, "");
    if (!inbound.has(slug)) {
      inbound.set(slug, { slug, fromArticles: 0, fromHubMesh: 0 });
    }
  }

  for (const filePath of listArticleFiles()) {
    const body = readFileSync(filePath, "utf8");
    let match;
    while ((match = ARTICLE_LINK_RE.exec(body)) !== null) {
      const target = match[1];
      if (!inbound.has(target)) {
        inbound.set(target, { slug: target, fromArticles: 0, fromHubMesh: 0 });
      }
      inbound.get(target).fromArticles += 1;
    }
  }

  const meshPath = join(repoRoot, "site/src/data/hub-article-mesh.ts");
  const meshSource = readFileSync(meshPath, "utf8");
  const hubSlugRe = /slug:\s*"([a-z0-9-]+)"/g;
  let meshMatch;
  while ((meshMatch = hubSlugRe.exec(meshSource)) !== null) {
    const target = meshMatch[1];
    if (!inbound.has(target)) {
      inbound.set(target, { slug: target, fromArticles: 0, fromHubMesh: 0 });
    }
    inbound.get(target).fromHubMesh += 1;
  }

  return [...inbound.values()].map((entry) => ({
    ...entry,
    total: entry.fromArticles + entry.fromHubMesh,
  }));
}

const articles = loadPublishedArticles().filter((article) => !article.draft);
const publishedSlugs = new Set(articles.map((article) => article.slug));
const inboundCounts = countInboundFromArticles().filter((entry) =>
  publishedSlugs.has(entry.slug),
);

const lowInbound = inboundCounts
  .filter((entry) => entry.total < minInbound)
  .sort((a, b) => a.total - b.total || a.slug.localeCompare(b.slug));

const summary = {
  published: publishedSlugs.size,
  minInbound,
  lowInboundCount: lowInbound.length,
  averageInbound:
    inboundCounts.reduce((sum, entry) => sum + entry.total, 0) /
    Math.max(inboundCounts.length, 1),
  lowInbound: lowInbound.map((entry) => ({
    slug: entry.slug,
    total: entry.total,
    fromArticles: entry.fromArticles,
    fromHubMesh: entry.fromHubMesh,
  })),
};

if (asJson) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

console.log(
  `orphan-audit: ${summary.published} published, ${summary.lowInboundCount} below min-inbound=${minInbound}`,
);
console.log(`average inbound links: ${summary.averageInbound.toFixed(1)}`);

if (lowInbound.length === 0) {
  console.log("No low-inbound articles.");
  process.exit(0);
}

console.log("\nLow-inbound articles:");
for (const entry of lowInbound) {
  console.log(
    `  ${entry.slug}: total=${entry.total} (articles=${entry.fromArticles}, hub=${entry.fromHubMesh})`,
  );
}
