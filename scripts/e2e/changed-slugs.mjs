/**
 * Resolve article slugs changed in a PR or recent commit.
 *
 * Usage:
 *   node scripts/e2e/changed-slugs.mjs
 *   node scripts/e2e/changed-slugs.mjs --format=comma
 *   node scripts/e2e/changed-slugs.mjs --format=env
 *   node scripts/e2e/changed-slugs.mjs --format=json
 *   node scripts/e2e/changed-slugs.mjs --base=origin/main --head=HEAD
 *   node scripts/e2e/changed-slugs.mjs --no-fallback
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { loadE2eConfig, repoRoot, articlesPathPrefix } from "./e2e-utils.mjs";
import {
  articlePathsFromDiff,
  formatSlugs,
  parseArgs,
  resolveRange,
  selectOutputSlugs,
  slugsFromPaths,
} from "./changed-slugs-lib.mjs";

const {
  format,
  base: baseArg,
  head: headArg,
  noFallback,
} = parseArgs(process.argv.slice(2));

function runGit(argsList) {
  return execFileSync("git", argsList, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function changedArticlePaths(base, head) {
  let diffOutput = "";
  try {
    diffOutput = runGit([
      "diff",
      "--name-only",
      `${base}...${head}`,
      "--",
      articlesPathPrefix,
    ]);
  } catch {
    try {
      diffOutput = runGit(["diff", "--name-only", base, head, "--", articlesPathPrefix]);
    } catch {
      return [];
    }
  }

  return articlePathsFromDiff(diffOutput);
}

function resolveChangedSlugs() {
  const { base, head } = resolveRange(
    { base: baseArg, head: headArg },
    process.env,
    (path) => JSON.parse(readFileSync(path, "utf8")),
  );
  return { base, head, slugs: slugsFromPaths(changedArticlePaths(base, head)) };
}

function fallbackSlugs() {
  const config = loadE2eConfig();
  return config.smokeSlugs ?? [];
}

const { base, head, slugs } = resolveChangedSlugs();
// Only read the e2e config when the fallback can actually be used.
const needsFallback = slugs.length === 0 && !noFallback;
const outputSlugs = selectOutputSlugs(slugs, {
  noFallback,
  fallbackSlugs: needsFallback ? fallbackSlugs() : [],
});

if (format === "lines") {
  console.error(`changed-slugs: base=${base} head=${head} count=${outputSlugs.length}`);
}

process.stdout.write(formatSlugs(outputSlugs, format));
