/**
 * GSC Playwright session — recommended login via `playwright codegen`.
 *
 * Google blocks script-launched Chrome ("browser may not be secure").
 * Codegen opens a normal Chrome window; you log in manually, then close it to save cookies.
 *
 * Usage:
 *   npm run gsc:auth:login
 *   npm run gsc:verify-ui
 *
 * Output: gsc-playwright-auth.json (gitignored)
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { siteUrlFromEnv } from "./auth.mjs";
import { defaultStoragePath } from "./playwright-storage.mjs";

function sampleInspectUrl(siteUrl) {
  const resourceId = encodeURIComponent(siteUrl);
  const samplePage = "https://sim-hikari-guide.com/articles/sim-fukukaisen-osusume";
  return `https://search.google.com/search-console/inspect?resource_id=${resourceId}&id=${encodeURIComponent(samplePage)}`;
}

function main() {
  const siteUrl = siteUrlFromEnv();
  const startUrl = sampleInspectUrl(siteUrl);

  console.log("GSC Playwright auth (codegen mode)");
  console.log(`- property: ${siteUrl}`);
  console.log(`- output:   ${defaultStoragePath}`);
  console.log("");
  console.log("Google blocks automation-launched login. Use codegen instead:");
  console.log("");
  console.log("  1. Chrome opens with Playwright Inspector");
  console.log("  2. Log in with your Google account in the Chrome window");
  console.log("  3. Open URL Inspection and confirm the property loads");
  console.log("  4. Close the Chrome window → session saved automatically");
  console.log("");
  console.log(
    "If login shows「安全でない可能性があります」, you are on the old script path.",
  );
  console.log("Use this command (codegen), not gsc:auth:login:legacy.");
  console.log("");

  const install = spawnSync("npx", ["playwright", "install", "chrome"], {
    stdio: "inherit",
  });
  if (install.status !== 0) {
    process.exit(install.status ?? 1);
  }

  const codegen = spawnSync(
    "npx",
    [
      "playwright",
      "codegen",
      "--browser=chrome",
      `--save-storage=${defaultStoragePath}`,
      startUrl,
    ],
    { stdio: "inherit" },
  );

  if (codegen.status !== 0) {
    process.exit(codegen.status ?? 1);
  }

  if (!existsSync(defaultStoragePath)) {
    console.error("");
    console.error(`Expected output missing: ${defaultStoragePath}`);
    console.error("Close the Chrome window after login to save the session.");
    process.exit(1);
  }

  console.log("");
  console.log(`Saved storage state: ${defaultStoragePath}`);
  console.log("");
  console.log("Next:");
  console.log("  npm run gsc:verify-ui");
  console.log(
    "  ./scripts/gh-user.sh secret set GSC_PLAYWRIGHT_STORAGE_STATE < <(base64 -i gsc-playwright-auth.json | tr -d '\\n')",
  );
}

main();
