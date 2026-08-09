/**
 * Request Google Search Console indexing via UI (Playwright).
 *
 * Requires an authenticated storage state (see npm run gsc:auth:login).
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { siteUrlFromEnv } from "./auth.mjs";
import { loadPlaywrightStorageState } from "./playwright-storage.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const REQUEST_BUTTON =
  /request indexing|インデックス登録をリクエスト|登録をリクエスト|インデックス作成をリクエスト/i;
const ALREADY_INDEXED =
  /url is on google|google に登録|インデックス登録済|登録されています/i;
const TEST_LIVE_BUTTON = /test live url|ライブ url をテスト|ライブ URL/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function propertyResourceId(siteUrl) {
  return encodeURIComponent(siteUrlFromEnv() || siteUrl);
}

/**
 * @param {import('playwright').Page} page
 * @param {string} url
 */
async function openUrlInspection(page, url, siteUrl) {
  const resourceId = propertyResourceId(siteUrl);
  const directUrl = `https://search.google.com/search-console/inspect?resource_id=${resourceId}&id=${encodeURIComponent(url)}`;
  await page.goto(directUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});

  const searchInput = page
    .locator('input[type="url"], input[aria-label*="Inspect"], input[aria-label*="検査"]')
    .first();
  if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await searchInput.fill(url);
    await searchInput.press("Enter");
    await sleep(2500);
  }
}

/**
 * @param {import('playwright').Page} page
 */
async function clickRequestIndexing(page) {
  const bodyText = (await page.locator("body").innerText().catch(() => "")) ?? "";
  if (ALREADY_INDEXED.test(bodyText)) {
    return { status: "already_indexed", message: "URL appears indexed in GSC UI" };
  }

  const liveTest = page.getByRole("button", { name: TEST_LIVE_BUTTON }).first();
  if (await liveTest.isVisible({ timeout: 3000 }).catch(() => false)) {
    await liveTest.click();
    await sleep(4000);
  }

  const requestButton = page.getByRole("button", { name: REQUEST_BUTTON }).first();
  if (await requestButton.isVisible({ timeout: 8000 }).catch(() => false)) {
    await requestButton.click();
    await sleep(2000);
    return { status: "requested", message: "Indexing request submitted in GSC UI" };
  }

  const refreshedText = (await page.locator("body").innerText().catch(() => "")) ?? "";
  if (ALREADY_INDEXED.test(refreshedText)) {
    return { status: "already_indexed", message: "URL appears indexed after live test" };
  }

  return {
    status: "skipped",
    message: "Request indexing button not found (quota, permissions, or UI change)",
  };
}

/**
 * @param {string} url
 * @param {{ headless?: boolean, screenshotDir?: string, siteUrl?: string }} [options]
 */
export async function requestIndexingViaUi(url, options = {}) {
  const storageState = loadPlaywrightStorageState();
  if (!storageState) {
    throw new Error(
      "Playwright storage state missing. Run npm run gsc:auth:login or set GSC_PLAYWRIGHT_STORAGE_STATE.",
    );
  }

  const siteUrl = options.siteUrl ?? siteUrlFromEnv();
  const headless = options.headless ?? process.env.GSC_PLAYWRIGHT_HEADLESS !== "false";
  const screenshotDir =
    options.screenshotDir ?? join(repoRoot, "docs/operations/gsc-inspect-screenshots");

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  try {
    await openUrlInspection(page, url, siteUrl);
    const result = await clickRequestIndexing(page);

    if (result.status === "skipped" && options.screenshotDir !== null) {
      mkdirSync(screenshotDir, { recursive: true });
      const slug = url.split("/").pop() ?? "unknown";
      const shotPath = join(screenshotDir, `${slug}-${Date.now()}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      result.screenshot = shotPath;
    }

    return result;
  } catch (error) {
    if (options.screenshotDir !== null) {
      mkdirSync(screenshotDir, { recursive: true });
      const slug = url.split("/").pop() ?? "unknown";
      const shotPath = join(screenshotDir, `${slug}-error-${Date.now()}.png`);
      await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {});
      writeFileSync(
        shotPath.replace(/\.png$/, ".txt"),
        error instanceof Error ? error.stack ?? error.message : String(error),
        "utf8",
      );
    }
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * @param {string[]} urls
 * @param {{ headless?: boolean, delayMs?: number, siteUrl?: string }} [options]
 */
export async function requestIndexingBatchViaUi(urls, options = {}) {
  const storageState = loadPlaywrightStorageState();
  if (!storageState) {
    throw new Error(
      "Playwright storage state missing. Run npm run gsc:auth:login or set GSC_PLAYWRIGHT_STORAGE_STATE.",
    );
  }

  const siteUrl = options.siteUrl ?? siteUrlFromEnv();
  const headless = options.headless ?? process.env.GSC_PLAYWRIGHT_HEADLESS !== "false";
  const delayMs = options.delayMs ?? 2000;
  const results = [];

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  try {
    for (const url of urls) {
      await openUrlInspection(page, url, siteUrl);
      const outcome = await clickRequestIndexing(page);
      results.push({ url, ...outcome });
      await sleep(delayMs);
    }
    return results;
  } finally {
    await context.close();
    await browser.close();
  }
}
