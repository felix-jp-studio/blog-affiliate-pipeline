import { expect, test } from "@playwright/test";
import { visualPages } from "./fixtures/pages";
import { snapshotText } from "./helpers/normalize-text";
import { stabilizePage, visualMaskLocators } from "./helpers/stabilize-page";

const { homepage } = visualPages;

test.describe("homepage", () => {
  test("visual and text snapshots", async ({ page }) => {
    await page.goto(homepage.path);
    await stabilizePage(page);

    const main = page.locator(homepage.visualLocator);
    await expect(main).toHaveScreenshot(homepage.visualSnapshot, {
      mask: visualMaskLocators(page),
    });

    const featuredTitleCount = Math.min(
      2,
      await page.locator(".home-featured__grid .article-card__title").count(),
    );
    const featuredTitleSelectors = Array.from(
      { length: featuredTitleCount },
      (_, index) =>
        `.home-featured__grid .article-card:nth-of-type(${index + 1}) .article-card__title`,
    );

    const latestTitleCount = Math.min(
      2,
      await page.locator(".latest-articles__grid .article-card__title").count(),
    );
    const latestTitleSelectors = Array.from(
      { length: latestTitleCount },
      (_, index) =>
        `.latest-articles__grid .article-card:nth-of-type(${index + 1}) .article-card__title`,
    );

    const text = await snapshotText(page, [
      "h1",
      ".lead",
      "#home-featured-title",
      ...featuredTitleSelectors,
      ...latestTitleSelectors,
    ]);
    expect(text).toMatchSnapshot(homepage.textSnapshot);
  });
});
