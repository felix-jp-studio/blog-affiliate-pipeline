#!/usr/bin/env node
/**
 * Copy Playwright screenshot diff PNGs into .github/pr-visual-diffs/ for PR comment embedding.
 *
 * Usage:
 *   node scripts/e2e/collect-visual-diffs.mjs [--test-results dir] [--output dir]
 *
 * Env:
 *   VISUAL_TEST_RESULTS_DIR - Playwright test-results (default: site/test-results)
 *   VISUAL_DIFF_OUTPUT_DIR  - destination (default: .github/pr-visual-diffs)
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VISUAL_PAGES, visualSnapshotBase } from "./visual-pages.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "../..");

const DIFF_SUFFIXES = ["-diff.png", "-expected.png", "-actual.png"];

function parseArgs(argv) {
  const args = { testResults: null, output: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--test-results") {
      args.testResults = argv[i + 1] ?? null;
      i += 1;
    } else if (arg === "--output") {
      args.output = argv[i + 1] ?? null;
      i += 1;
    }
  }
  return args;
}

/** @param {string} dir */
function listPngFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  /** @type {string[]} */
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listPngFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".png")) {
      files.push(fullPath);
    }
  }

  return files;
}

/** @param {string} fileName @param {string} snapshotBase */
function matchesSnapshotBase(fileName, snapshotBase) {
  return DIFF_SUFFIXES.some((suffix) => fileName === `${snapshotBase}${suffix}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const testResultsDir =
    args.testResults ??
    process.env.VISUAL_TEST_RESULTS_DIR ??
    join(repoRoot, "site/test-results");
  const outputDir =
    args.output ??
    process.env.VISUAL_DIFF_OUTPUT_DIR ??
    join(repoRoot, ".github/pr-visual-diffs");

  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }
  mkdirSync(outputDir, { recursive: true });

  const pngFiles = listPngFiles(testResultsDir);
  let copied = 0;

  for (const page of VISUAL_PAGES) {
    const snapshotBase = visualSnapshotBase(page.visualSnapshot);

    for (const suffix of DIFF_SUFFIXES) {
      const sourceName = `${snapshotBase}${suffix}`;
      const source = pngFiles.find((file) => file.endsWith(`/${sourceName}`));
      if (!source) {
        continue;
      }

      const destName = `${page.label}${suffix}`;
      copyFileSync(source, join(outputDir, destName));
      copied += 1;
      process.stdout.write(`Copied ${sourceName} -> ${destName}\n`);
    }
  }

  if (copied === 0) {
    process.stdout.write(`No visual diff PNGs found under ${testResultsDir}\n`);
  } else {
    process.stdout.write(`Collected ${copied} PNG(s) into ${outputDir}\n`);
  }
}

main();
