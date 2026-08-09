/**
 * Parse URL Inspection API indexStatusResult → indexed verdict helpers.
 */

const INDEXED_COVERAGE_STATES = new Set([
  "Submitted and indexed",
  "Indexed, not submitted in sitemap",
  "Indexed though blocked by robots.txt",
]);

/**
 * @param {Record<string, unknown> | null | undefined} indexStatus
 */
export function parseIndexStatus(indexStatus) {
  if (!indexStatus || typeof indexStatus !== "object") {
    return {
      verdict: null,
      coverageState: null,
      indexingState: null,
      lastCrawlTime: null,
      pageFetchState: null,
      robotsTxtState: null,
    };
  }

  return {
    verdict: typeof indexStatus.verdict === "string" ? indexStatus.verdict : null,
    coverageState:
      typeof indexStatus.coverageState === "string" ? indexStatus.coverageState : null,
    indexingState:
      typeof indexStatus.indexingState === "string" ? indexStatus.indexingState : null,
    lastCrawlTime:
      typeof indexStatus.lastCrawlTime === "string" ? indexStatus.lastCrawlTime : null,
    pageFetchState:
      typeof indexStatus.pageFetchState === "string" ? indexStatus.pageFetchState : null,
    robotsTxtState:
      typeof indexStatus.robotsTxtState === "string" ? indexStatus.robotsTxtState : null,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} indexStatus
 */
export function isIndexedStatus(indexStatus) {
  const parsed = parseIndexStatus(indexStatus);
  if (parsed.verdict === "PASS") {
    return true;
  }
  if (parsed.coverageState && INDEXED_COVERAGE_STATES.has(parsed.coverageState)) {
    return true;
  }
  return false;
}

/**
 * @param {Record<string, unknown>} inspectionResult
 */
export function extractInspectionMeta(inspectionResult) {
  const indexStatus = inspectionResult?.indexStatusResult;
  const parsed = parseIndexStatus(indexStatus);
  return {
    ...parsed,
    indexed: isIndexedStatus(indexStatus),
    source: "api",
  };
}
