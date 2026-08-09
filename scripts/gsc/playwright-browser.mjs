/**
 * Shared Playwright browser launch for GSC UI automation.
 * Prefer Chrome channel — Google often rejects headless Chromium sessions.
 */
import { chromium } from "playwright";

export function gscHeadless() {
  return process.env.GSC_PLAYWRIGHT_HEADLESS !== "false";
}

export function gscBrowserChannel() {
  return process.env.GSC_PLAYWRIGHT_CHANNEL?.trim() || "chrome";
}

/**
 * @param {{ headless?: boolean, channel?: string }} [options]
 */
export async function launchGscBrowser(options = {}) {
  const headless = options.headless ?? gscHeadless();
  const channel = options.channel ?? gscBrowserChannel();
  const launchOptions = {
    headless,
    args: ["--disable-blink-features=AutomationControlled"],
  };

  try {
    return await chromium.launch({ ...launchOptions, channel });
  } catch (error) {
    if (channel === "chromium") {
      throw error;
    }
    console.warn(
      `gsc-ui: "${channel}" unavailable (${error instanceof Error ? error.message : error}) — falling back to chromium`,
    );
    return chromium.launch(launchOptions);
  }
}

/**
 * @param {import('playwright').Browser} browser
 * @param {import('playwright').BrowserContextOptions['storageState']} storageState
 */
export async function newGscContext(browser, storageState) {
  return browser.newContext({
    storageState,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    viewport: { width: 1280, height: 900 },
  });
}

export const SIGN_IN_PAGE =
  /sign in to continue|ログイン|accounts\.google\.com|signin\/identifier|signin\/rejected|search-console\/about|安全でない可能性/i;

export const GSC_ERROR_PAGE = /404\.|That's an error|エラーが発生しました|That's all we know/i;

/**
 * @param {import('playwright').Page} page
 */
export async function detectAuthRequired(page) {
  const currentUrl = page.url();
  if (/accounts\.google\.com/i.test(currentUrl)) {
    return true;
  }
  if (/\/search-console\/about\b/i.test(currentUrl)) {
    return true;
  }
  const bodyText =
    (await page
      .locator("body")
      .innerText()
      .catch(() => "")) ?? "";
  if (GSC_ERROR_PAGE.test(bodyText)) {
    return true;
  }
  return SIGN_IN_PAGE.test(bodyText);
}

/**
 * @param {import('playwright').Page} page
 */
export function authRequiredResult(page) {
  return {
    status: "auth_required",
    message: `Google sign-in required (url=${page.url()}). Re-run npm run gsc:auth:login with Chrome and update GSC_PLAYWRIGHT_STORAGE_STATE.`,
  };
}
