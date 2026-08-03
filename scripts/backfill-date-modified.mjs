/**
 * Backfill dateModified frontmatter for articles missing the field.
 * Sets dateModified to pubDate (explicit baseline for freshness metadata).
 *
 * Usage:
 *   node scripts/backfill-date-modified.mjs
 *   node scripts/backfill-date-modified.mjs --dry-run
 */
import { readFileSync, writeFileSync } from "node:fs";
import { listArticleFiles, parseFrontmatter } from "./e2e/e2e-utils.mjs";

const dryRun = process.argv.includes("--dry-run");
let updated = 0;
let skipped = 0;

for (const filePath of listArticleFiles()) {
  const slug = filePath.split("/").pop().replace(/\.md$/, "");
  const content = readFileSync(filePath, "utf8");
  const parsed = parseFrontmatter(content);

  if (parsed.error) {
    console.warn(`skip ${slug}: ${parsed.error}`);
    skipped += 1;
    continue;
  }

  if (parsed.fields.dateModified) {
    skipped += 1;
    continue;
  }

  const pubDate = parsed.fields.pubDate;
  if (!pubDate || Number.isNaN(Date.parse(pubDate))) {
    console.warn(`skip ${slug}: invalid pubDate`);
    skipped += 1;
    continue;
  }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    skipped += 1;
    continue;
  }

  const pubDateLine = `pubDate: ${pubDate}`;
  const frontmatter = match[1];
  if (!frontmatter.includes(pubDateLine)) {
    console.warn(`skip ${slug}: pubDate line not found for insertion`);
    skipped += 1;
    continue;
  }

  const newFrontmatter = frontmatter.replace(
    pubDateLine,
    `${pubDateLine}\ndateModified: ${pubDate}`,
  );
  const newContent = content.replace(match[1], newFrontmatter);

  if (!dryRun) {
    writeFileSync(filePath, newContent, "utf8");
  }
  updated += 1;
  console.log(`${dryRun ? "[dry-run] " : ""}updated ${slug} → dateModified: ${pubDate}`);
}

console.log(
  `backfill-date-modified: ${updated} updated, ${skipped} skipped${dryRun ? " (dry-run)" : ""}`,
);
