import { expect, test } from "@playwright/test";
import { visualPages } from "./fixtures/pages";
import { snapshotText } from "./helpers/normalize-text";
import { stabilizePage, visualMaskLocators } from "./helpers/stabilize-page";

const { contact } = visualPages;

test.describe("contact page", () => {
  test("visual and text snapshots", async ({ page }) => {
    await page.goto(contact.path);
    await stabilizePage(page);

    const main = page.locator(contact.visualLocator);
    await expect(main).toHaveScreenshot(contact.visualSnapshot, {
      mask: visualMaskLocators(page),
    });

    const text = await snapshotText(page, [
      "main h1",
      "main > p:first-of-type",
      "main h2:nth-of-type(1) + p",
    ]);
    expect(text).toMatchSnapshot(contact.textSnapshot);
  });
});
