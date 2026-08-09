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

function parseStorageStateEnv(raw) {
  if (raw.startsWith("{")) {
    return JSON.parse(raw);
  }

  const normalized = raw.replace(/\s/g, "");
  const decoded = Buffer.from(normalized, "base64").toString("utf8");
  return JSON.parse(decoded);
}

export function loadPlaywrightStorageState() {
  const encoded = process.env.GSC_PLAYWRIGHT_STORAGE_STATE?.trim();
  if (encoded) {
    try {
      return parseStorageStateEnv(encoded);
    } catch {
      throw new Error(
        "GSC_PLAYWRIGHT_STORAGE_STATE must be raw JSON or base64-encoded JSON (use: base64 -i gsc-playwright-auth.json | tr -d '\\n')",
      );
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
