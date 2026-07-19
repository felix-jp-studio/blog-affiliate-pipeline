/**
 * Production smoke test — public URLs only (no secrets required).
 *
 * Usage:
 *   npm run test:e2e:smoke
 *   PRODUCTION_URL=https://example.com npm run test:e2e:smoke
 *   E2E_SMOKE_SLUGS=slug-a,slug-b npm run test:e2e:smoke
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot, fail, pass } from "./e2e-utils.mjs";

const configPath = join(repoRoot, "config/e2e-smoke.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

const baseUrl = (process.env.PRODUCTION_URL ?? config.productionUrl).replace(/\/$/, "");
const smokeSlugs = process.env.E2E_SMOKE_SLUGS
  ? process.env.E2E_SMOKE_SLUGS.split(",")
      .map((slug) => slug.trim())
      .filter(Boolean)
  : config.smokeSlugs;
const requiredOgTags = config.requiredOgTags ?? ["og:image"];
const retry = {
  maxAttempts: 5,
  initialDelayMs: 15000,
  maxDelayMs: 60000,
  ...config.retry,
};

const errors = [];
let checksRun = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, label) {
  let delay = retry.initialDelayMs;

  for (let attempt = 1; attempt <= retry.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (response.status === 200) {
        const body = await response.text();
        if (attempt > 1) {
          console.log(`[OK] ${label}: HTTP 200 (attempt ${attempt})`);
        }
        return body;
      }

      if (attempt < retry.maxAttempts) {
        console.log(
          `[RETRY ${attempt}/${retry.maxAttempts}] ${label}: HTTP ${response.status}, waiting ${delay}ms`,
        );
        await sleep(delay);
        delay = Math.min(delay * 2, retry.maxDelayMs);
        continue;
      }

      errors.push(`${label}: expected HTTP 200, got ${response.status} (${url})`);
      return null;
    } catch (err) {
      if (attempt < retry.maxAttempts) {
        console.log(
          `[RETRY ${attempt}/${retry.maxAttempts}] ${label}: ${err.message}, waiting ${delay}ms`,
        );
        await sleep(delay);
        delay = Math.min(delay * 2, retry.maxDelayMs);
        continue;
      }
      errors.push(
        `${label}: fetch failed after ${retry.maxAttempts} attempts (${err.message})`,
      );
      return null;
    }
  }

  return null;
}

function missingOgTags(html, tags) {
  return tags.filter(
    (tag) => !html.includes(`property="${tag}"`) && !html.includes(`name="${tag}"`),
  );
}

function extractLocUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

async function collectSitemapText(startPath) {
  const visited = new Set();
  const chunks = [];

  async function walk(pathOrUrl) {
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${baseUrl}${pathOrUrl}`;
    if (visited.has(url)) {
      return;
    }
    visited.add(url);

    const body = await fetchWithRetry(url, `sitemap ${url}`);
    if (!body) {
      return;
    }
    chunks.push(body);

    if (body.includes("<sitemapindex")) {
      for (const loc of extractLocUrls(body)) {
        await walk(loc);
      }
    }
  }

  await walk(startPath);
  return chunks.join("\n");
}

async function checkStaticPages() {
  for (const page of config.staticPages ?? []) {
    const label = page.label ?? page.path;
    const url = `${baseUrl}${page.path}`;
    checksRun += 1;

    const body = await fetchWithRetry(url, label);
    if (!body) {
      continue;
    }

    if ((page.checks ?? []).includes("sitemapXml")) {
      if (!body.includes("<sitemap") && !body.includes("<urlset")) {
        errors.push(`${label}: response is not valid sitemap XML`);
      }
    }
  }
}

async function checkArticles() {
  for (const slug of smokeSlugs) {
    const label = `article/${slug}`;
    const url = `${baseUrl}/articles/${slug}`;
    checksRun += 1;

    const body = await fetchWithRetry(url, label);
    if (!body) {
      continue;
    }

    const missing = missingOgTags(body, requiredOgTags);
    if (missing.length > 0) {
      errors.push(`${label}: missing og tags: ${missing.join(", ")}`);
    }
  }
}

async function checkSitemapSlugs() {
  checksRun += 1;
  const sitemapText = await collectSitemapText("/sitemap-index.xml");
  if (!sitemapText) {
    return;
  }

  for (const slug of smokeSlugs) {
    if (!sitemapText.includes(`/articles/${slug}`)) {
      errors.push(`sitemap: missing slug ${slug}`);
    }
  }
}

console.log(`Production smoke: ${baseUrl}`);
console.log(`Smoke slugs: ${smokeSlugs.join(", ")}`);

await checkStaticPages();
await checkArticles();
await checkSitemapSlugs();

if (errors.length > 0) {
  fail(errors);
}

pass("smoke-production", checksRun);
