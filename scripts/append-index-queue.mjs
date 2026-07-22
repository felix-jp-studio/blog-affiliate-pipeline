/**
 * Append newly published article slugs to data/gsc-index-queue.json.
 *
 * Usage:
 *   node scripts/append-index-queue.mjs --from-git
 *   node scripts/append-index-queue.mjs slug-one slug-two
 *   node scripts/append-index-queue.mjs --slugs=slug-one,slug-two
 *   node scripts/append-index-queue.mjs --from-git --dry-run
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadE2eConfig, repoRoot } from "./e2e/e2e-utils.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const queuePath = join(repoRoot, "data/gsc-index-queue.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fromGit = args.includes("--from-git");
const slugsArg = args.find((arg) => arg.startsWith("--slugs="));
const positionalSlugs = args.filter((arg) => !arg.startsWith("-"));

function siteUrl() {
  const config = loadE2eConfig();
  return (config.productionUrl ?? "https://sim-hikari-guide.com").replace(/\/$/, "");
}

function articleUrl(slug) {
  return `${siteUrl()}/articles/${slug}`;
}

function loadQueue() {
  if (!existsSync(queuePath)) {
    return {
      siteUrl: siteUrl(),
      updatedAt: null,
      entries: [],
    };
  }

  const queue = JSON.parse(readFileSync(queuePath, "utf8"));
  if (!Array.isArray(queue.entries)) {
    throw new Error("gsc-index-queue.json: entries must be an array");
  }
  return queue;
}

function resolveSlugs() {
  if (fromGit) {
    const output = execFileSync(
      "node",
      ["scripts/e2e/changed-slugs.mjs", "--format=json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    ).trim();
    const slugs = JSON.parse(output || "[]");
    return [...new Set(slugs.filter(Boolean))];
  }

  if (slugsArg) {
    return [
      ...new Set(
        slugsArg
          .slice("--slugs=".length)
          .split(",")
          .map((slug) => slug.trim())
          .filter(Boolean),
      ),
    ];
  }

  return [...new Set(positionalSlugs.filter(Boolean))];
}

function appendSlugs(slugs, mergedAt = new Date().toISOString()) {
  const queue = loadQueue();
  const existingSlugs = new Set(queue.entries.map((entry) => entry.slug));
  const added = [];

  for (const slug of slugs) {
    if (existingSlugs.has(slug)) {
      continue;
    }
    queue.entries.push({
      slug,
      url: articleUrl(slug),
      mergedAt,
      indexed: false,
    });
    existingSlugs.add(slug);
    added.push(slug);
  }

  queue.siteUrl = siteUrl();
  queue.updatedAt = new Date().toISOString();

  return { queue, added };
}

function writeQueue(queue) {
  mkdirSync(dirname(queuePath), { recursive: true });
  writeFileSync(queuePath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
}

const slugs = resolveSlugs();
if (slugs.length === 0) {
  console.log("append-index-queue: no slugs to append");
  process.exit(0);
}

const { queue, added } = appendSlugs(slugs);

if (added.length === 0) {
  console.log(`append-index-queue: all ${slugs.length} slug(s) already in queue`);
  process.exit(0);
}

console.log(`append-index-queue: added ${added.length} slug(s): ${added.join(", ")}`);

if (dryRun) {
  console.log(
    JSON.stringify(
      queue.entries.filter((entry) => added.includes(entry.slug)),
      null,
      2,
    ),
  );
  process.exit(0);
}

writeQueue(queue);
console.log(
  `append-index-queue: wrote ${queuePath} (${queue.entries.length} total entries)`,
);
