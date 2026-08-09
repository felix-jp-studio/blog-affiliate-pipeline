/**
 * Request Google Search Console indexing via UI (Playwright).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadPlaywrightStorageState } from "./playwright-storage.mjs";
import { navigateToUrlInspection, isGoogleInterstitial404 } from "./gsc-ui-nav.mjs";
import {
  authRequiredResult,
  detectAuthRequired,
  launchGscBrowser,
  newGscContext,
} from "./playwright-browser.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const REQUEST_BUTTON =
  /request indexing|インデックス登録をリクエスト|インデックス登録を要求|登録をリクエスト|インデックス作成をリクエスト|索引付けをリクエスト/i;
const ALREADY_INDEXED =
  /url is on google|google に登録|インデックス登録済|登録されています|送信して登録されました|URL は Google に登録/i;
const TEST_LIVE_BUTTON =
  /test live url|ライブ url をテスト|ライブ URL|ライブ URL をテスト/i;
const NOT_INDEXED =
  /not on google|google に登録されていません|インデックス未登録|インデックスに登録/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickRequestIndexing(page) {
  if (await detectAuthRequired(page)) {
    return authRequiredResult(page);
  }

  const bodyText =
    (await page
      .locator("body")
      .innerText()
      .catch(() => "")) ?? "";
  if (isGoogleInterstitial404(bodyText)) {
    return {
      status: "skipped",
      message: "Google interstitial 404 — inspect URL may be invalid",
    };
  }
  if (ALREADY_INDEXED.test(bodyText)) {
    return { status: "already_indexed", message: "URL appears indexed in GSC UI" };
  }

  const liveTest = page.getByRole("button", { name: TEST_LIVE_BUTTON }).first();
  if (await liveTest.isVisible({ timeout: 5000 }).catch(() => false)) {
    await liveTest.click();
    await sleep(5000);
  } else if (NOT_INDEXED.test(bodyText)) {
    await sleep(2000);
  }

  const requestButton = page.getByRole("button", { name: REQUEST_BUTTON }).first();
  if (await requestButton.isVisible({ timeout: 12_000 }).catch(() => false)) {
    await requestButton.click();
    await sleep(2000);
    return { status: "requested", message: "Indexing request submitted in GSC UI" };
  }

  const linkRequest = page.getByRole("link", { name: REQUEST_BUTTON }).first();
  if (await linkRequest.isVisible({ timeout: 3000 }).catch(() => false)) {
    await linkRequest.click();
    await sleep(2000);
    return {
      status: "requested",
      message: "Indexing request submitted in GSC UI (link)",
    };
  }

  const refreshedText =
    (await page
      .locator("body")
      .innerText()
      .catch(() => "")) ?? "";
  if (ALREADY_INDEXED.test(refreshedText)) {
    return { status: "already_indexed", message: "URL appears indexed after live test" };
  }

  return {
    status: "skipped",
    message: "Request indexing button not found (quota, permissions, or UI change)",
  };
}

async function captureScreenshot(page, url, screenshotDir) {
  mkdirSync(screenshotDir, { recursive: true });
  const slug = url.split("/").pop() ?? "unknown";
  const shotPath = join(screenshotDir, `${slug}-${Date.now()}.png`);
  await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {});
  return shotPath;
}

export async function requestIndexingViaUi(url, options = {}) {
  const storageState = loadPlaywrightStorageState();
  if (!storageState) {
    throw new Error(
      "Playwright storage state missing. Run npm run gsc:auth:login or set GSC_PLAYWRIGHT_STORAGE_STATE.",
    );
  }

  const screenshotDir =
    options.screenshotDir ?? join(repoRoot, "docs/operations/gsc-inspect-screenshots");
  const browser = await launchGscBrowser({ headless: options.headless });
  const context = await newGscContext(browser, storageState);
  const page = await context.newPage();

  try {
    const navBlock = await navigateToUrlInspection(page, url, options.siteUrl);
    if (navBlock) {
      if (options.screenshotDir !== null) {
        navBlock.screenshot = await captureScreenshot(page, url, screenshotDir);
      }
      return navBlock;
    }

    const result = await clickRequestIndexing(page);
    if (
      (result.status === "skipped" || result.status === "auth_required") &&
      options.screenshotDir !== null
    ) {
      result.screenshot = await captureScreenshot(page, url, screenshotDir);
    }
    return result;
  } catch (error) {
    if (options.screenshotDir !== null) {
      const shotPath = await captureScreenshot(page, url, screenshotDir);
      writeFileSync(
        shotPath.replace(/\.png$/, ".txt"),
        error instanceof Error ? (error.stack ?? error.message) : String(error),
        "utf8",
      );
    }
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export async function requestIndexingBatchViaUi(urls, options = {}) {
  const storageState = loadPlaywrightStorageState();
  if (!storageState) {
    throw new Error(
      "Playwright storage state missing. Run npm run gsc:auth:login or set GSC_PLAYWRIGHT_STORAGE_STATE.",
    );
  }

  const delayMs = options.delayMs ?? 2000;
  const screenshotDir = join(repoRoot, "docs/operations/gsc-inspect-screenshots");
  const results = [];
  const browser = await launchGscBrowser({ headless: options.headless });
  const context = await newGscContext(browser, storageState);
  const page = await context.newPage();

  try {
    for (const url of urls) {
      const navBlock = await navigateToUrlInspection(page, url, options.siteUrl);
      if (navBlock) {
        navBlock.screenshot = await captureScreenshot(page, url, screenshotDir);
        results.push({ url, ...navBlock });
        continue;
      }

      const outcome = await clickRequestIndexing(page);
      if (outcome.status === "skipped" || outcome.status === "auth_required") {
        outcome.screenshot = await captureScreenshot(page, url, screenshotDir);
      }
      results.push({ url, ...outcome });
      await sleep(delayMs);
    }
    return results;
  } finally {
    await context.close();
    await browser.close();
  }
}
