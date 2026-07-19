import { expect, test } from "@playwright/test";
import { visualPages } from "./fixtures/pages";
import { snapshotText } from "./helpers/normalize-text";
import { stabilizePage, visualMaskLocators } from "./helpers/stabilize-page";

const { articleTemplate } = visualPages;

test.describe("article template page", () => {
  test("visual and text snapshots", async ({ page }) => {
    await page.goto(articleTemplate.path);
    await stabilizePage(page);

    const shell = page.locator(articleTemplate.visualLocator);
    await expect(shell).toHaveScreenshot(articleTemplate.visualSnapshot, {
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
    expect(text).toMatchSnapshot(articleTemplate.textSnapshot);
  });
});
