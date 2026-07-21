import { expect, test } from "@playwright/test";
import { visualPages } from "./fixtures/pages";
import { snapshotText } from "./helpers/normalize-text";
import { stabilizePage, visualMaskLocators } from "./helpers/stabilize-page";

const { crosssellArticle } = visualPages;

test.describe("crosssell article page", () => {
  test("visual and text snapshots", async ({ page }) => {
    await page.goto(crosssellArticle.path);
    await stabilizePage(page);

    const shell = page.locator(crosssellArticle.visualLocator);
    await expect(shell).toHaveScreenshot(crosssellArticle.visualSnapshot, {
      mask: visualMaskLocators(page),
    });

    const headings = page.locator(".article-body h2");
    const headingCount = Math.min(5, await headings.count());
    const headingSelectors = Array.from(
      { length: headingCount },
      (_, index) => `.article-body h2:nth-of-type(${index + 1})`,
    );

    const text = await snapshotText(page, [
      ".article-hero__title",
      ".article-hero__lead",
      ...headingSelectors,
    ]);
    expect(text).toMatchSnapshot(crosssellArticle.textSnapshot);
  });
});
