/**
 * Verify IndexNow key file in dist or on production.
 *
 * Usage:
 *   node scripts/e2e/verify-indexnow-key.mjs
 *   node scripts/e2e/verify-indexnow-key.mjs --target=dist
 *   INDEXNOW_KEY=your-key node scripts/e2e/verify-indexnow-key.mjs --target=production
 *
 * Skips (exit 0) when INDEXNOW_KEY is unset.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { distDir, fail, loadE2eConfig, pass, repoRoot } from "./e2e-utils.mjs";

const KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;
const indexnowConfigPath = join(repoRoot, "config/indexnow.json");

function loadProductionUrl() {
  const e2e = loadE2eConfig();
  if (existsSync(indexnowConfigPath)) {
    const indexnow = JSON.parse(readFileSync(indexnowConfigPath, "utf8"));
    return (
      process.env.PRODUCTION_URL ??
      indexnow.productionUrl ??
      e2e.productionUrl ??
      "https://sim-hikari-guide.com"
    ).replace(/\/$/, "");
  }
  return (
    process.env.PRODUCTION_URL ??
    e2e.productionUrl ??
    "https://sim-hikari-guide.com"
  ).replace(/\/$/, "");
}

function skip(message) {
  console.log(`[skip] ${message}`);
  process.exit(0);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const key = process.env.INDEXNOW_KEY?.trim();
if (!key) {
  skip("INDEXNOW_KEY is not set");
}

if (!KEY_PATTERN.test(key)) {
  fail(["INDEXNOW_KEY must be 8-128 ASCII letters, digits, or hyphens"]);
}

const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
const target = targetArg?.split("=")[1] ?? "production";

if (target === "dist") {
  const filePath = join(distDir, `${key}.txt`);
  if (!existsSync(filePath)) {
    fail([`IndexNow key file missing in dist: ${filePath}`]);
  }
  const body = readFileSync(filePath, "utf8").trim();
  if (body !== key) {
    fail([
      `IndexNow key file content mismatch: expected key string, got ${body.length} chars`,
    ]);
  }
  pass("verify-indexnow-key (dist)", 1);
  process.exit(0);
}

if (target !== "production") {
  fail([`unknown --target=${target} (use dist or production)`]);
}

const config = loadE2eConfig();
const retry = {
  maxAttempts: 5,
  initialDelayMs: 15000,
  maxDelayMs: 60000,
  ...config.retry,
};

const productionUrl = loadProductionUrl();
const url = `${productionUrl}/${key}.txt`;
let delay = retry.initialDelayMs;
let lastError = `IndexNow key file not served (${url})`;

for (let attempt = 1; attempt <= retry.maxAttempts; attempt++) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (response.status === 200) {
      const body = (await response.text()).trim();
      if (body !== key) {
        fail([`IndexNow key file content mismatch at ${url}`]);
      }
      if (attempt > 1) {
        console.log(`[OK] IndexNow key file verified (attempt ${attempt})`);
      }
      pass("verify-indexnow-key (production)", 1);
      process.exit(0);
    }

    lastError =
      `IndexNow key file not served (${url}): HTTP ${response.status}. ` +
      "Set INDEXNOW_KEY on Vercel Production and redeploy.";
  } catch (err) {
    lastError = `IndexNow key file fetch failed (${url}): ${err.message}`;
  }

  if (attempt < retry.maxAttempts) {
    console.log(
      `[RETRY ${attempt}/${retry.maxAttempts}] ${lastError}, waiting ${delay}ms`,
    );
    await sleep(delay);
    delay = Math.min(delay * 2, retry.maxDelayMs);
  }
}

fail([lastError]);
