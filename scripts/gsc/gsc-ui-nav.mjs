/**
 * Navigate GSC UI to URL Inspection for a specific page URL.
 */
import { siteUrlFromEnv } from "./auth.mjs";
import {
  authRequiredResult,
  detectAuthRequired,
  isGoogleInterstitial404,
} from "./playwright-browser.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function encodedResourceId(siteUrl) {
  return encodeURIComponent(siteUrlFromEnv() || siteUrl);
}

function isGscInspectLoaded(bodyText) {
  return /URL 検査|URL Inspection|インデックス|indexing/i.test(bodyText);
}

/**
 * @param {import('playwright').Page} page
 * @param {string} inspectionUrl
 * @param {string} [siteUrl]
 */
export async function navigateToUrlInspection(page, inspectionUrl, siteUrl) {
  const resourceId = encodedResourceId(siteUrl);
  const propertyUrl = `https://search.google.com/search-console?resource_id=${resourceId}`;
  const inspectHomeUrl = `https://search.google.com/search-console/inspect?resource_id=${resourceId}`;

  await page.goto(propertyUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
  await sleep(1500);

  if (await detectAuthRequired(page)) {
    return authRequiredResult(page);
  }

  let bodyText =
    (await page
      .locator("body")
      .innerText()
      .catch(() => "")) ?? "";
  if (isGoogleInterstitial404(bodyText)) {
    return {
      status: "skipped",
      message: `Google interstitial 404 loading property — ${page.url()}`,
    };
  }

  const inspectNav = page
    .getByRole("link", { name: /URL 検査|URL Inspection|検査/i })
    .first();
  if (await inspectNav.isVisible({ timeout: 5000 }).catch(() => false)) {
    await inspectNav.click();
    await sleep(2000);
  } else {
    await page.goto(inspectHomeUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
    await sleep(1500);
  }

  if (await detectAuthRequired(page)) {
    return authRequiredResult(page);
  }

  const searchInput = page
    .locator(
      [
        'input[placeholder*="URL"]',
        'input[aria-label*="URL"]',
        'input[aria-label*="検査"]',
        'input[aria-label*="Inspect"]',
        'input[type="url"]',
      ].join(", "),
    )
    .first();

  if (!(await searchInput.isVisible({ timeout: 15_000 }).catch(() => false))) {
    bodyText =
      (await page
        .locator("body")
        .innerText()
        .catch(() => "")) ?? "";
    return {
      status: "skipped",
      message: isGoogleInterstitial404(bodyText)
        ? `Google interstitial 404 — ${page.url()}`
        : "URL Inspection search input not found",
    };
  }

  await searchInput.fill(inspectionUrl);
  await searchInput.press("Enter");
  await sleep(4000);

  bodyText =
    (await page
      .locator("body")
      .innerText()
      .catch(() => "")) ?? "";
  if (isGoogleInterstitial404(bodyText)) {
    return {
      status: "skipped",
      message: `Google interstitial 404 after inspect search — ${page.url()}`,
    };
  }
  if (await detectAuthRequired(page)) {
    return authRequiredResult(page);
  }
  if (!isGscInspectLoaded(bodyText)) {
    return {
      status: "skipped",
      message: "URL Inspection panel did not load after search",
    };
  }

  return null;
}

export { isGscInspectLoaded, isGoogleInterstitial404 };
