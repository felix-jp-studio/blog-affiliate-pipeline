/**
 * Verify Playwright storage state can reach GSC without Google sign-in.
 *
 * Usage:
 *   npm run gsc:verify-ui
 */
import { siteUrlFromEnv } from "./auth.mjs";
import {
  hasPlaywrightStorage,
  loadPlaywrightStorageState,
} from "./playwright-storage.mjs";
import {
  authRequiredResult,
  detectAuthRequired,
  launchGscBrowser,
  newGscContext,
} from "./playwright-browser.mjs";

async function main() {
  if (!hasPlaywrightStorage()) {
    console.error(
      "Playwright storage missing. Run npm run gsc:auth:login or set GSC_PLAYWRIGHT_STORAGE_STATE.",
    );
    process.exit(1);
  }

  const storageState = loadPlaywrightStorageState();
  const siteUrl = siteUrlFromEnv();
  const resourceId = encodeURIComponent(siteUrl);
  const startUrl = `https://search.google.com/search-console?resource_id=${resourceId}`;

  console.log(`Property: ${siteUrl}`);
  console.log(`Opening: ${startUrl}`);

  const browser = await launchGscBrowser();
  const context = await newGscContext(browser, storageState);
  const page = await context.newPage();

  try {
    await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});

    if (await detectAuthRequired(page)) {
      const result = authRequiredResult(page);
      console.error(`FAILED — ${result.message}`);
      console.error("");
      console.error("Fix:");
      console.error("  1. npm run gsc:auth:login  (uses Chrome — same browser as CI)");
      console.error("  2. Update GSC_PLAYWRIGHT_STORAGE_STATE secret");
      return 2;
    }

    console.log(`OK — GSC loaded (${page.url()})`);
    return 0;
  } finally {
    await context.close();
    await browser.close();
  }
}

main().then((code) => process.exit(code ?? 0));
