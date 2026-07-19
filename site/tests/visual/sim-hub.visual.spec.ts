import { expect, test } from "@playwright/test";
import { visualPages } from "./fixtures/pages";
import { snapshotText } from "./helpers/normalize-text";
import { stabilizePage, visualMaskLocators } from "./helpers/stabilize-page";

const { simHub } = visualPages;

test.describe("sim hub page", () => {
  test("visual and text snapshots", async ({ page }) => {
    await page.goto(simHub.path);
    await stabilizePage(page);

    const hub = page.locator(simHub.visualLocator);
    await expect(hub).toHaveScreenshot(simHub.visualSnapshot, {
      mask: visualMaskLocators(page),
    });

    const titleCount = Math.min(
      3,
      await page.locator(".category-hub__item .article-card__title").count(),
    );
    const titleSelectors = Array.from(
      { length: titleCount },
      (_, index) => `.category-hub__item:nth-of-type(${index + 1}) .article-card__title`,
    );

    const text = await snapshotText(page, [
      ".category-hero__title",
      ".category-hero__lead",
      ...titleSelectors,
    ]);
    expect(text).toMatchSnapshot(simHub.textSnapshot);
  });
});
