import { expect, test } from "@playwright/test";
import { visualPages } from "./fixtures/pages";
import { snapshotText } from "./helpers/normalize-text";
import { stabilizePage, visualMaskLocators } from "./helpers/stabilize-page";

const { hikariHub } = visualPages;

test.describe("hikari hub page", () => {
  test("visual and text snapshots", async ({ page }) => {
    await page.goto(hikariHub.path);
    await stabilizePage(page);

    const hub = page.locator(hikariHub.visualLocator);
    await expect(hub).toHaveScreenshot(hikariHub.visualSnapshot, {
      mask: visualMaskLocators(page),
    });

    const titleCount = Math.min(
      3,
      await page.locator(".category-hub__item .article-card__title").count(),
    );
    const titleSelectors = Array.from(
      { length: titleCount },
      (_, index) =>
        `.category-hub__item:nth-of-type(${index + 1}) .article-card__title`,
    );

    const text = await snapshotText(page, [
      ".category-hero__title",
      ".category-hero__lead",
      ...titleSelectors,
    ]);
    expect(text).toMatchSnapshot(hikariHub.textSnapshot);
  });
});
