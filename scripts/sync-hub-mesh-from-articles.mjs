#!/usr/bin/env node
/**
 * Add hub mesh featured entries for published articles missing from hub-article-mesh.
 *
 * Usage:
 *   node scripts/sync-hub-mesh-from-articles.mjs
 *   node scripts/sync-hub-mesh-from-articles.mjs --dry-run
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { hubArticleMesh } from "../site/src/data/hub-article-mesh.ts";
import { loadPublishedArticles, repoRoot } from "./e2e/e2e-utils.mjs";
import { PATHS, inferCategory, makeLabelFromTitle } from "./visitability/lib.mjs";

const dryRun = process.argv.includes("--dry-run");

const meshSlugs = new Set();
for (const mesh of Object.values(hubArticleMesh)) {
  for (const item of mesh.featured) {
    meshSlugs.add(item.slug);
  }
}

function makeLabel(title, slug) {
  const direct = makeLabelFromTitle(title);
  if (direct) return direct;
  const afterBracket = title.match(/】\s*(.+?)(?:｜|$)/)?.[1]?.trim();
  if (afterBracket) {
    const fromBracket = makeLabelFromTitle(afterBracket) || afterBracket;
    if (fromBracket.length <= 24) return fromBracket;
    return `${fromBracket.slice(0, 22)}…`;
  }
  return slug;
}

function readTitleFromMarkdown(slug) {
  const path = join(repoRoot, "site/src/content/articles", `${slug}.md`);
  if (!existsSync(path)) return slug;
  const content = readFileSync(path, "utf8");
  const match =
    content.match(/^title:\s*"([^"]+)"\s*$/m) ??
    content.match(/^title:\s*'([^']+)'\s*$/m) ??
    content.match(/^title:\s*(.+)\s*$/m);
  return match?.[1]?.trim() ?? slug;
}

function appendFeatured(content, category, slug, label) {
  const blockStart = content.indexOf(`  ${category}: {`);
  if (blockStart === -1) {
    throw new Error(`Category block not found: ${category}`);
  }

  const featuredStart = content.indexOf("featured: [", blockStart);
  if (featuredStart === -1) {
    throw new Error(`featured array not found for ${category}`);
  }

  const featuredEnd = content.indexOf("\n    ],", featuredStart);
  if (featuredEnd === -1) {
    throw new Error(`featured array end not found for ${category}`);
  }

  const featuredSection = content.slice(featuredStart, featuredEnd);
  if (featuredSection.includes(`slug: "${slug}"`)) {
    return content;
  }

  const insertion = `
      {
        slug: "${slug}",
        label: "${label.replace(/"/g, '\\"')}",
      }`;

  return `${content.slice(0, featuredEnd)}${insertion}${content.slice(featuredEnd)}`;
}

const missing = loadPublishedArticles()
  .filter((article) => !article.draft && !meshSlugs.has(article.slug))
  .sort((a, b) => a.slug.localeCompare(b.slug));

if (missing.length === 0) {
  console.log("sync-hub-mesh: all published articles are in hub mesh");
  process.exit(0);
}

const entries = missing.map((article) => {
  const title = readTitleFromMarkdown(article.slug);
  const articleType = article.fields.articleType ?? "howto";
  const category =
    article.fields.category ??
    inferCategory(article.fields.keyword ?? title, articleType);
  return {
    slug: article.slug,
    category,
    label: makeLabel(title, article.slug),
  };
});

console.log(`sync-hub-mesh: adding ${entries.length} entries`);
for (const entry of entries) {
  console.log(`  ${entry.slug} (${entry.category})`);
}

let content = readFileSync(PATHS.hubMesh, "utf8");
for (const entry of entries) {
  content = appendFeatured(content, entry.category, entry.slug, entry.label);
}

if (dryRun) {
  console.log("sync-hub-mesh: dry-run OK");
  process.exit(0);
}

writeFileSync(PATHS.hubMesh, content, "utf8");
console.log(`sync-hub-mesh: updated ${PATHS.hubMesh}`);

const prettier = spawnSync(
  "npx",
  ["prettier", "--write", "src/data/hub-article-mesh.ts"],
  { cwd: join(repoRoot, "site"), stdio: "inherit" },
);
if (prettier.status !== 0) {
  process.exit(prettier.status ?? 1);
}
