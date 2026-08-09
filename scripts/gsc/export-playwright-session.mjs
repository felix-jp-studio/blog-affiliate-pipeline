/**
 * Interactive login → save Playwright storage state for GSC UI automation.
 *
 * Legacy path — Google often blocks this with「安全でない可能性があります」.
 * Prefer: npm run gsc:auth:login (codegen).
 *
 * Usage:
 *   npm run gsc:auth:login:legacy
 *   GSC_SITE_URL=https://sim-hikari-guide.com/ npm run gsc:auth:login
 *
 * Output: gsc-playwright-auth.json (gitignored)
 * GitHub Secret: base64 -i gsc-playwright-auth.json | pbcopy → GSC_PLAYWRIGHT_STORAGE_STATE
 */
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { siteUrlFromEnv } from "./auth.mjs";
import { defaultStoragePath, savePlaywrightStorageState } from "./playwright-storage.mjs";
import { launchGscBrowser } from "./playwright-browser.mjs";

function waitForEnter(message) {
  const rl = createInterface({ input, output });
  return rl.question(message).finally(() => rl.close());
}

async function main() {
  const siteUrl = siteUrlFromEnv();
  const resourceId = encodeURIComponent(siteUrl);
  const startUrl = `https://search.google.com/search-console?resource_id=${resourceId}`;

  console.log("GSC Playwright auth export");
  console.log(`- property: ${siteUrl}`);
  console.log(`- output:   ${defaultStoragePath}`);
  console.log("");
  console.log("1. Chrome will open (same browser family as CI).");
  console.log("2. Log in with your Google account if prompted.");
  console.log("3. Confirm the Search Console property is visible.");
  console.log("4. Return here and press Enter to save the session.");
  console.log("");
  console.warn(
    "Note: If Google shows「安全でない可能性があります」, stop and run: npm run gsc:auth:login",
  );
  console.log("");

  const browser = await launchGscBrowser({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(startUrl, { waitUntil: "domcontentloaded" });

  await waitForEnter("\nPress Enter after login + property selection... ");

  const outPath = await savePlaywrightStorageState(context, defaultStoragePath);
  await browser.close();

  console.log("");
  console.log(`Saved storage state: ${outPath}`);
  console.log("");
  console.log("GitHub Actions secret:");
  console.log("  base64 -i gsc-playwright-auth.json | pbcopy");
  console.log("  → Settings → Secrets → GSC_PLAYWRIGHT_STORAGE_STATE");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
