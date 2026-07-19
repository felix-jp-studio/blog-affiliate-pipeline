import type { Locator, Page } from "@playwright/test";

export const VISUAL_MASK_SELECTORS = [
  ".article-hero time",
  "[datetime]",
  'a[href*="px.a8.net"]',
  'a[href*="valuecommerce.com"]',
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
}

export function visualMaskLocators(page: Page): Locator[] {
  return VISUAL_MASK_SELECTORS.map((selector) => page.locator(selector));
}
