import type { Page } from "@playwright/test";

export function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export async function collectVisibleTexts(
  page: Page,
  selectors: string[],
): Promise<string[]> {
  const lines: string[] = [];

  for (const selector of selectors) {
    const locator = page.locator(selector);
    const count = await locator.count();

    for (let index = 0; index < count; index += 1) {
      const raw = await locator.nth(index).innerText();
      const normalized = normalizeText(raw);
      if (normalized) {
        lines.push(normalized);
      }
    }
  }

  return lines;
}

export async function snapshotText(
  page: Page,
  selectors: string[],
): Promise<string> {
  const lines = await collectVisibleTexts(page, selectors);
  return lines.join("\n");
}
