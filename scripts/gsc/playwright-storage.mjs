/**
 * Load Playwright storage state for GSC UI automation.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";

export const defaultStoragePath = join(repoRoot, "gsc-playwright-auth.json");

export function hasPlaywrightStorage() {
  if (process.env.GSC_PLAYWRIGHT_STORAGE_STATE?.trim()) {
    return true;
  }
  const path = process.env.GSC_PLAYWRIGHT_STORAGE_PATH?.trim() || defaultStoragePath;
  return existsSync(path);
}

export function loadPlaywrightStorageState() {
  const encoded = process.env.GSC_PLAYWRIGHT_STORAGE_STATE?.trim();
  if (encoded) {
    try {
      return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    } catch {
      throw new Error("GSC_PLAYWRIGHT_STORAGE_STATE is not valid base64 JSON");
    }
  }

  const path = process.env.GSC_PLAYWRIGHT_STORAGE_PATH?.trim() || defaultStoragePath;
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * @param {import('playwright').BrowserContext} context
 * @param {string} [outPath]
 */
export async function savePlaywrightStorageState(context, outPath = defaultStoragePath) {
  await context.storageState({ path: outPath });
  return outPath;
}

export function writePlaywrightStorageState(state, outPath = defaultStoragePath) {
  writeFileSync(outPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  return outPath;
}
