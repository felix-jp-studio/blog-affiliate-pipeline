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

    const titleCount = Math.min(
      3,
      await page.locator(".latest-articles__grid .article-card__title").count(),
    );
    const titleSelectors = Array.from(
      { length: titleCount },
      (_, index) =>
        `.latest-articles__grid .article-card:nth-of-type(${index + 1}) .article-card__title`,
    );

    const text = await snapshotText(page, ["h1", ".lead", ...titleSelectors]);
    expect(text).toMatchSnapshot(homepage.textSnapshot);
  });
});
