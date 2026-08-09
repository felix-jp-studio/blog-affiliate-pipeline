/**
 * Verify GSC API access: list properties and test URL Inspection.
 *
 * Usage:
 *   npm run gsc:verify-access
 *   npm run gsc:verify-access -- https://example.com/page
 */
import { getAccessToken, hasApiCredentials, siteUrlFromEnv, siteUrlCandidates } from "./auth.mjs";
import { inspectUrlWithFallback } from "./inspect-url.mjs";

const SITES_ENDPOINT = "https://www.googleapis.com/webmasters/v3/sites";

async function listSites(accessToken) {
  const response = await fetch(SITES_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Sites list API ${response.status}: ${JSON.stringify(body)}`);
  }
  return body.siteEntry ?? [];
}

async function main() {
  if (!hasApiCredentials()) {
    console.error(
      "GSC API credentials missing. Set GSC_SERVICE_ACCOUNT_JSON or GSC_OAUTH_*.",
    );
    process.exit(1);
  }

  const accessToken = await getAccessToken();
  const sites = await listSites(accessToken);

  console.log("Accessible GSC properties:");
  if (sites.length === 0) {
    console.log("  (none — add SA email in Search Console → Settings → Users and permissions)");
  } else {
    for (const site of sites) {
      console.log(`  - ${site.siteUrl} (${site.permissionLevel ?? "unknown"})`);
    }
  }

  console.log("");
  console.log(`Configured GSC_SITE_URL: ${siteUrlFromEnv()}`);
  console.log(`Fallback candidates: ${siteUrlCandidates().join(", ")}`);

  const testUrl =
    process.argv[2]?.trim() ||
    "https://sim-hikari-guide.com/articles/sim-fukukaisen-osusume";
  console.log("");
  console.log(`Test URL Inspection: ${testUrl}`);

  try {
    const result = await inspectUrlWithFallback(accessToken, testUrl);
    console.log(`OK — siteUrl=${result.siteUrl} verdict=${result.inspection?.verdict ?? "—"}`);
    return 0;
  } catch (error) {
    console.error(
      `FAILED — ${error instanceof Error ? error.message : error}`,
    );
    console.error("");
    console.error("Checklist:");
    console.error("  1. SA client_email is added in GSC with Full permission");
    console.error("  2. GSC_SITE_URL matches property type (URL-prefix vs sc-domain:...)");
    console.error("  3. Test URL belongs to the configured property");
    return 2;
  }
}

main().then((code) => process.exit(code ?? 0));
