import type { Locator, Page } from "@playwright/test";
import { affiliateHostPatterns } from "../../../src/utils/asp-urls";

const AFFILIATE_MASK_SELECTORS = affiliateHostPatterns().map(
  (host) => `a[href*="${host}"]`,
);

export const VISUAL_MASK_SELECTORS = [
  ".article-hero time",
  "[datetime]",
  ...AFFILIATE_MASK_SELECTORS,
  ".category-hero__count",
  ".contact-form",
  ".article-hero__eyecatch",
] as const;

export async function stabilizePage(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
      * { font-family: system-ui, sans-serif !important; }
    `,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
    const delay = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });
    const images = Array.from(document.images);
    await Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );
    const maxScroll = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
    );
    window.scrollTo(0, maxScroll);
    await delay(150);
    window.scrollTo(0, 0);
    await delay(150);
  });
}

export function visualMaskLocators(page: Page): Locator[] {
  return VISUAL_MASK_SELECTORS.map((selector) => page.locator(selector));
}
