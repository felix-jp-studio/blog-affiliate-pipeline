/**
 * Write IndexNow verification file to public/ when INDEXNOW_KEY is set.
 * Runs during site build (Vercel Production env).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const key = process.env.INDEXNOW_KEY?.trim();
const KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;

if (!key) {
  console.log("[indexnow] INDEXNOW_KEY unset — skipping key file generation");
  process.exit(0);
}

if (!KEY_PATTERN.test(key)) {
  console.error(
    "[indexnow] INDEXNOW_KEY must be 8-128 ASCII letters, digits, or hyphens",
  );
  process.exit(1);
}

const publicDir = join(process.cwd(), "public");
mkdirSync(publicDir, { recursive: true });
const filePath = join(publicDir, `${key}.txt`);
writeFileSync(filePath, key, "utf8");
console.log(`[indexnow] wrote ${filePath}`);
