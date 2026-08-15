import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";

export const ASP_URLS_PATH = join(repoRoot, "config/asp-urls.json");

const PROGRAM_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function readAspUrls(path = ASP_URLS_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeAspUrls(data, path = ASP_URLS_PATH) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function validateProgramKey(programKey) {
  if (typeof programKey !== "string" || !PROGRAM_KEY_PATTERN.test(programKey)) {
    return "programKey must be a lowercase slug (e.g. uq-mobile)";
  }
  return null;
}

export function hostMatchesPattern(hostname, hostPattern) {
  return hostname === hostPattern || hostname.endsWith(`.${hostPattern}`);
}

export function inferProviderFromUrl(trackingUrl, registry) {
  let parsed;
  try {
    parsed = new URL(trackingUrl);
  } catch {
    return null;
  }
  const host = parsed.hostname;
  for (const [providerKey, provider] of Object.entries(registry.providers ?? {})) {
    const pattern = provider?.tracking?.hostPattern;
    if (pattern && hostMatchesPattern(host, pattern)) {
      return providerKey;
    }
  }
  return null;
}

export function validateTrackingUrl(trackingUrl, providerKey, registry) {
  if (typeof trackingUrl !== "string" || !trackingUrl.startsWith("https://")) {
    return "trackingUrl must be an https URL";
  }

  let parsed;
  try {
    parsed = new URL(trackingUrl);
  } catch {
    return "trackingUrl is not a valid URL";
  }

  const provider = registry.providers?.[providerKey];
  if (!provider) {
    return `unknown provider: ${providerKey}`;
  }

  const hostPattern = provider.tracking?.hostPattern;
  if (!hostPattern) {
    return `provider ${providerKey} has no tracking hostPattern`;
  }

  if (!hostMatchesPattern(parsed.hostname, hostPattern)) {
    return `trackingUrl host must match ${hostPattern} for provider ${providerKey}`;
  }

  if (providerKey === "a8") {
    if (!parsed.searchParams.has("a8mat")) {
      return "A8 trackingUrl must include a8mat query parameter";
    }
  }

  if (providerKey === "valuecommerce") {
    if (!parsed.searchParams.has("pid") || !parsed.searchParams.has("sid")) {
      return "ValueCommerce trackingUrl must include sid and pid query parameters";
    }
  }

  return null;
}

export function validateAspProgramId(programId, providerKey) {
  if (typeof programId !== "string" || programId.trim() === "") {
    return "programId must be a non-empty string";
  }

  if (providerKey === "a8" && !/^[A-Z0-9+]+$/.test(programId)) {
    return "A8 programId must use uppercase alphanumeric segments separated by +";
  }

  if (providerKey === "valuecommerce" && !/^\d+$/.test(programId)) {
    return "ValueCommerce programId must be numeric";
  }

  return null;
}

export function extractProgramIdFromUrl(trackingUrl, providerKey) {
  const parsed = new URL(trackingUrl);
  if (providerKey === "a8") {
    const match = parsed.search.match(/[?&]a8mat=([^&]*)/);
    if (!match) {
      return null;
    }
    // A8 program IDs use literal +; URLSearchParams would decode + as space.
    return decodeURIComponent(match[1].replace(/\+/g, "%2B"));
  }
  if (providerKey === "valuecommerce") {
    return parsed.searchParams.get("pid");
  }
  return null;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Apply a single intake record to asp-urls.json (in memory).
 * @param {object} registry
 * @param {object} entry
 * @returns {{ registry: object, changes: string[] }}
 */
export function applyIntake(registry, entry) {
  const programKey = entry.programKey ?? entry.id;
  const keyError = validateProgramKey(programKey);
  if (keyError) {
    throw new Error(keyError);
  }

  const trackingUrl = entry.trackingUrl;
  if (!trackingUrl) {
    throw new Error("trackingUrl is required");
  }

  const existing = registry.programs?.[programKey] ?? {};
  const providerKey =
    entry.provider ?? existing.provider ?? inferProviderFromUrl(trackingUrl, registry);
  if (!providerKey) {
    throw new Error("provider could not be inferred; set provider (a8 or valuecommerce)");
  }

  const urlError = validateTrackingUrl(trackingUrl, providerKey, registry);
  if (urlError) {
    throw new Error(urlError);
  }

  const programId =
    entry.programId ??
    extractProgramIdFromUrl(trackingUrl, providerKey) ??
    existing.programId;
  const programIdError = validateAspProgramId(programId, providerKey);
  if (programIdError) {
    throw new Error(programIdError);
  }

  const urlProgramId = extractProgramIdFromUrl(trackingUrl, providerKey);
  if (entry.programId && urlProgramId && entry.programId !== urlProgramId) {
    throw new Error("programId does not match trackingUrl query parameters");
  }

  const status = entry.status ?? "active";
  if (!["active", "pending"].includes(status)) {
    throw new Error("status must be active or pending");
  }

  const updatedProgram = {
    ...existing,
    label: entry.label ?? existing.label ?? programKey,
    category: entry.category ?? existing.category,
    provider: providerKey,
    programId,
    trackingUrl,
    status,
    lastVerified: todayIsoDate(),
  };

  if (entry.note !== undefined) {
    updatedProgram.note = entry.note;
  }

  const nextRegistry = structuredClone(registry);
  nextRegistry.programs ??= {};
  nextRegistry.programs[programKey] = updatedProgram;
  nextRegistry.updatedAt = todayIsoDate();

  const changes = [
    `programs.${programKey}.trackingUrl`,
    `programs.${programKey}.programId`,
    `programs.${programKey}.status=${status}`,
    `programs.${programKey}.lastVerified`,
    "updatedAt",
  ];

  return { registry: nextRegistry, changes };
}

export function applyIntakeBatch(registry, entries) {
  let current = registry;
  const allChanges = [];

  for (const entry of entries) {
    const { registry: next, changes } = applyIntake(current, entry);
    current = next;
    allChanges.push(...changes);
  }

  return { registry: current, changes: allChanges };
}
