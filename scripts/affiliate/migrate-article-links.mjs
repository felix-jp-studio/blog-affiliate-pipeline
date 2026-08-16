#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { listArticleFiles, parseFrontmatter, repoRoot } from "../e2e/e2e-utils.mjs";
import { migrateMarkdownLinks, readAspUrls } from "./lib.mjs";

const VALID_CATEGORIES = new Set(["sim", "hikari", "cost", "trouble"]);

function parseArgs(argv) {
  const args = { dryRun: false, category: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--category") {
      args.category = argv[i + 1];
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (args.category && !VALID_CATEGORIES.has(args.category)) {
    throw new Error(`Invalid category: ${args.category}`);
  }

  return args;
}

function articleCategory(filePath, content) {
  const parsed = parseFrontmatter(content);
  return parsed.error ? null : parsed.fields.category;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const registry = readAspUrls();
  const files = listArticleFiles();

  let scanned = 0;
  let changedFiles = 0;
  let totalReplacements = 0;
  const unmappedAll = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");
    const category = articleCategory(filePath, content);
    if (args.category && category !== args.category) {
      continue;
    }

    scanned += 1;
    const {
      content: nextContent,
      replacements,
      unmapped,
    } = migrateMarkdownLinks(content, registry);

    if (unmapped.length > 0) {
      const slug = filePath.split("/").pop().replace(/\.md$/, "");
      for (const item of unmapped) {
        unmappedAll.push({ slug, ...item });
      }
    }

    if (nextContent === content) {
      continue;
    }

    changedFiles += 1;
    totalReplacements += replacements.length;

    if (args.dryRun) {
      console.log(`[dry-run] ${filePath} (${replacements.length} links)`);
      for (const replacement of replacements) {
        console.log(`  ${replacement.programKey}: ${replacement.url}`);
      }
      continue;
    }

    writeFileSync(filePath, nextContent, "utf8");
    console.log(`Updated ${filePath} (${replacements.length} links)`);
  }

  console.log("");
  console.log(
    `[migrate] scanned=${scanned} changed=${changedFiles} replacements=${totalReplacements}${args.dryRun ? " (dry-run)" : ""}`,
  );

  if (unmappedAll.length > 0) {
    console.warn(`[migrate] ${unmappedAll.length} ASP URL(s) could not be mapped:`);
    for (const item of unmappedAll) {
      console.warn(`  - ${item.slug}: ${item.url}`);
    }
    process.exitCode = 1;
  }
}

main();
