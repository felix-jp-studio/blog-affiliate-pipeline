/**
 * Ping IndexNow after article URLs change (post-merge / deploy).
 *
 * Usage:
 *   node scripts/indexnow-ping.mjs
 *   node scripts/indexnow-ping.mjs --slugs=slug-a,slug-b
 *   node scripts/indexnow-ping.mjs --dry-run
 *   INDEXNOW_KEY=... INDEXNOW_SLUGS=slug-a npm run indexnow:ping
 *
 * Skips silently (exit 0) when INDEXNOW_KEY is unset or no article slugs resolved.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(scriptDir, "..");
const indexnowConfigPath = join(repoRoot, "config/indexnow.json");
const e2eConfigPath = join(repoRoot, "config/e2e-smoke.json");

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const slugsArg = args.find((arg) => arg.startsWith("--slugs="));

function loadJson(path) {
  if (!existsSync(path)) {
    return {};
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function loadConfig() {
  const indexnow = loadJson(indexnowConfigPath);
  const e2e = loadJson(e2eConfigPath);
  const productionUrl = (
    process.env.PRODUCTION_URL ??
    indexnow.productionUrl ??
    e2e.productionUrl ??
    "https://sim-hikari-guide.com"
  ).replace(/\/$/, "");

  return {
    productionUrl,
    host: indexnow.host ?? new URL(productionUrl).hostname,
    endpoint: indexnow.endpoint ?? INDEXNOW_ENDPOINT,
    articlePathPrefix: indexnow.articlePathPrefix ?? "/articles/",
  };
}

function resolveSlugsFromChangedFiles() {
  try {
    const output = execFileSync(
      "node",
      ["scripts/e2e/changed-slugs.mjs", "--format=json", "--no-fallback"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    ).trim();
    const slugs = JSON.parse(output || "[]");
    return Array.isArray(slugs) ? slugs.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function resolveSlugs() {
  if (slugsArg) {
    return slugsArg
      .split("=")[1]
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean);
  }

  if (process.env.INDEXNOW_SLUGS) {
    return process.env.INDEXNOW_SLUGS.split(",")
      .map((slug) => slug.trim())
      .filter(Boolean);
  }

  return resolveSlugsFromChangedFiles();
}

function articleUrls(slugs, config) {
  const prefix = config.articlePathPrefix.startsWith("/")
    ? config.articlePathPrefix
    : `/${config.articlePathPrefix}`;
  const normalizedPrefix = prefix.replace(/\/$/, "");
  return slugs.map((slug) => `${config.productionUrl}${normalizedPrefix}/${slug}`);
}

function skip(message) {
  console.log(`[skip] ${message}`);
  process.exit(0);
}

const key = process.env.INDEXNOW_KEY?.trim();
if (!key) {
  skip("INDEXNOW_KEY is not set");
}

if (!KEY_PATTERN.test(key)) {
  console.error(
    "IndexNow key must be 8-128 characters of ASCII letters, digits, or hyphens.",
  );
  process.exit(1);
}

const config = loadConfig();
const slugs = resolveSlugs();
if (slugs.length === 0) {
  skip("no changed article slugs to ping");
}

const urlList = articleUrls(slugs, config);
const keyLocation = `${config.productionUrl}/${key}.txt`;
const payload = {
  host: config.host,
  key,
  keyLocation,
  urlList,
};

console.log(`IndexNow ping: host=${config.host} urls=${urlList.length}`);
for (const url of urlList) {
  console.log(`  - ${url}`);
}

if (dryRun) {
  console.log("[dry-run] request not sent");
  process.exit(0);
}

const response = await fetch(config.endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify(payload),
});

if (response.status === 200 || response.status === 202) {
  console.log(`[OK] IndexNow accepted (${response.status})`);
  process.exit(0);
}

const body = await response.text().catch(() => "");
console.error(`IndexNow ping failed: HTTP ${response.status}${body ? ` — ${body}` : ""}`);
process.exit(1);
