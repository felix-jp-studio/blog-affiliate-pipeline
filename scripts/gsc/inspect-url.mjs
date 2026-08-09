/**
 * Call Search Console URL Inspection API for one URL.
 */
import { getAccessToken, siteUrlFromEnv } from "./auth.mjs";
import { extractInspectionMeta } from "./inspect-result.mjs";

const INSPECT_ENDPOINT =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} accessToken
 * @param {string} inspectionUrl
 * @param {{ siteUrl?: string, languageCode?: string, retries?: number }} [options]
 */
export async function inspectUrl(accessToken, inspectionUrl, options = {}) {
  const siteUrl = options.siteUrl ?? siteUrlFromEnv();
  const languageCode = options.languageCode ?? "ja-JP";
  const retries = options.retries ?? 3;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(INSPECT_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inspectionUrl,
          siteUrl,
          languageCode,
        }),
      });

      const body = await response.json();

      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(
          `URL Inspection API ${response.status}: ${JSON.stringify(body)}`,
        );
        const backoffMs = Math.min(30_000, 1000 * 2 ** attempt);
        await sleep(backoffMs);
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `URL Inspection API ${response.status}: ${JSON.stringify(body)}`,
        );
      }

      const inspectionResult = body.inspectionResult ?? {};
      return {
        inspectionUrl,
        siteUrl,
        inspectionResult,
        inspection: extractInspectionMeta(inspectionResult),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries) {
        await sleep(1000 * 2 ** attempt);
      }
    }
  }

  throw lastError ?? new Error("URL Inspection API failed");
}

/**
 * @param {string} inspectionUrl
 * @param {{ siteUrl?: string, languageCode?: string }} [options]
 */
export async function inspectUrlWithAuth(inspectionUrl, options = {}) {
  const accessToken = await getAccessToken();
  return inspectUrl(accessToken, inspectionUrl, options);
}
