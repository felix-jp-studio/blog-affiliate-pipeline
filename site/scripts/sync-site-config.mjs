import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = dirname(fileURLToPath(import.meta.url));
const repoConfigDir = join(siteDir, "../../config");
const siteConfigDir = join(siteDir, "../config");

const files = ["asp-urls.json", "affiliate-rules.json"];

mkdirSync(siteConfigDir, { recursive: true });

for (const file of files) {
  const source = join(repoConfigDir, file);
  if (!existsSync(source)) {
    throw new Error(`Missing repo config file: ${source}`);
  }
  copyFileSync(source, join(siteConfigDir, file));
}

console.log(`Synced ${files.length} config files into site/config/`);
