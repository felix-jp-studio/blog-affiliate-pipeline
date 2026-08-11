#!/usr/bin/env node
/**
 * Append hub mesh featured entries for newly published articles.
 *
 * Usage:
 *   node scripts/visitability/update-hub-mesh.mjs --manifest=data/visitability-cycle-result.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { PATHS, readJson } from "./lib.mjs";

const args = process.argv.slice(2);
const manifestArg = args.find((arg) => arg.startsWith("--manifest="));
const dryRun = args.includes("--dry-run");

if (!manifestArg) {
  console.error("Usage: update-hub-mesh.mjs --manifest=path/to/manifest.json");
  process.exit(2);
}

const manifestPath = manifestArg.slice("--manifest=".length);
const manifest = readJson(manifestPath, { hubEntries: [] });
const entries = manifest.hubEntries ?? [];

if (entries.length === 0) {
  console.log("update-hub-mesh: no entries to add");
  process.exit(0);
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

  const insertion = `,
      {
        slug: "${slug}",
        label: "${label.replace(/"/g, '\\"')}",
      }`;

  return `${content.slice(0, featuredEnd)}${insertion}${content.slice(featuredEnd)}`;
}

let content = readFileSync(PATHS.hubMesh, "utf8");
for (const entry of entries) {
  content = appendFeatured(content, entry.category, entry.slug, entry.label);
}

if (dryRun) {
  console.log("update-hub-mesh: dry-run OK");
  process.exit(0);
}

writeFileSync(PATHS.hubMesh, content, "utf8");
console.log(`update-hub-mesh: added ${entries.length} entries`);
