/**
 * Verify Playwright storage state can reach GSC URL Inspection without sign-in.
 */
import { siteUrlFromEnv } from "./auth.mjs";
import {
  hasPlaywrightStorage,
  loadPlaywrightStorageState,
} from "./playwright-storage.mjs";
import { navigateToUrlInspection, isGscInspectLoaded } from "./gsc-ui-nav.mjs";
import { launchGscBrowser, newGscContext } from "./playwright-browser.mjs";

async function main() {
  if (!hasPlaywrightStorage()) {
    console.error(
      "Playwright storage missing. Run npm run gsc:auth:login or set GSC_PLAYWRIGHT_STORAGE_STATE.",
    );
    process.exit(1);
  }

  const storageState = loadPlaywrightStorageState();
  const siteUrl = siteUrlFromEnv();
  const samplePath =
    process.argv[2]?.trim() ||
    "https://sim-hikari-guide.com/articles/sim-fukukaisen-osusume";

  console.log(`Property: ${siteUrl}`);
  console.log(`Test URL: ${samplePath}`);
  console.log("Navigate: property home → URL Inspection → search");

  const browser = await launchGscBrowser();
  const context = await newGscContext(browser, storageState);
  const page = await context.newPage();

  try {
    const block = await navigateToUrlInspection(page, samplePath, siteUrl);
    if (block) {
      if (block.status === "auth_required") {
        console.error(`FAILED — ${block.message}`);
      } else {
        console.error(`FAILED — ${block.message}`);
      }
      console.error("");
      console.error("Fix:");
      console.error(
        "  1. npm run gsc:auth:login  (codegen — log in manually, close Chrome)",
      );
      console.error("  2. npm run gsc:verify-ui     (must OK before updating Secret)");
      console.error("  3. Update GSC_PLAYWRIGHT_STORAGE_STATE");
      return 2;
    }

    const bodyText =
      (await page
        .locator("body")
        .innerText()
        .catch(() => "")) ?? "";
    if (!isGscInspectLoaded(bodyText)) {
      console.error("FAILED — URL Inspection panel text not found");
      return 2;
    }

    console.log(`OK — URL Inspection loaded (${page.url()})`);
    return 0;
  } finally {
    await context.close();
    await browser.close();
  }
}

main().then((code) => process.exit(code ?? 0));
