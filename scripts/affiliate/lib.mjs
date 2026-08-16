import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";

export const ASP_URLS_PATH = join(repoRoot, "config/asp-urls.json");

export const AFFILIATE_PATHS = {
  state: join(repoRoot, "config/affiliate-sync-state.json"),
  brief: join(repoRoot, "data/affiliate-sync-brief.json"),
  healthReport: join(repoRoot, "data/affiliate-health-report.json"),
  intakeSchema: join(repoRoot, "config/affiliate-intake.schema.json"),
  pdcaLog: join(repoRoot, "docs/operations/affiliate-sync-log.md"),
};

const INTAKE_ALLOWED_KEYS = new Set([
  "programKey",
  "id",
  "programId",
  "trackingUrl",
  "provider",
  "label",
  "category",
  "status",
  "note",
]);

export function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

/**
 * Lightweight validation aligned with config/affiliate-intake.schema.json.
 * @param {object} entry
 * @param {{ requireProgramKey?: boolean }} [options]
 */
export function validateIntakeEntry(entry, { requireProgramKey = false } = {}) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return "intake entry must be a JSON object";
  }

  for (const key of Object.keys(entry)) {
    if (!INTAKE_ALLOWED_KEYS.has(key)) {
      return `unknown field: ${key}`;
    }
  }

  if (!entry.trackingUrl || typeof entry.trackingUrl !== "string") {
    return "trackingUrl is required";
  }
  if (!entry.trackingUrl.startsWith("https://")) {
    return "trackingUrl must use https";
  }

  const programKey = entry.programKey ?? entry.id;
  if (requireProgramKey && !programKey) {
    return "programKey is required (CLI arg, programKey, or id)";
  }
  if (programKey) {
    const keyError = validateProgramKey(programKey);
    if (keyError) return keyError;
  }

  if (entry.provider !== undefined && !["a8", "valuecommerce"].includes(entry.provider)) {
    return "provider must be a8 or valuecommerce";
  }
  if (entry.status !== undefined && !["active", "pending"].includes(entry.status)) {
    return "status must be active or pending";
  }
  if (
    entry.category !== undefined &&
    !["sim", "hikari", "cost", "trouble"].includes(entry.category)
  ) {
    return "category must be sim, hikari, cost, or trouble";
  }
  if (
    entry.programId !== undefined &&
    (typeof entry.programId !== "string" || !entry.programId.trim())
  ) {
    return "programId must be a non-empty string when provided";
  }

  return null;
}

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

const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
export const AFFILIATE_PLACEHOLDER_PATTERN = /\{AFFILIATE:[a-z0-9-]+\}/;
export const DEFAULT_LAST_VERIFIED_ALERT_DAYS = 90;

export function normalizeTrackingUrl(trackingUrl) {
  const parsed = new URL(trackingUrl);
  parsed.hash = "";
  return parsed.href;
}

/**
 * @param {object} registry
 * @returns {{ byUrl: Map<string, string>, byProgramId: Map<string, string> }}
 */
export function buildProgramUrlIndex(registry) {
  const byUrl = new Map();
  const byProgramId = new Map();

  for (const [programKey, program] of Object.entries(registry.programs ?? {})) {
    if (program.trackingUrl) {
      byUrl.set(normalizeTrackingUrl(program.trackingUrl), programKey);
    }
    if (program.programId && program.provider) {
      byProgramId.set(`${program.provider}:${program.programId}`, programKey);
    }
  }

  return { byUrl, byProgramId };
}

export function isAspTrackingUrl(urlString, registry) {
  try {
    return inferProviderFromUrl(urlString, registry) !== null;
  } catch {
    return false;
  }
}

export function resolveProgramKeyFromUrl(urlString, registry) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return null;
  }

  const providerKey = inferProviderFromUrl(urlString, registry);
  if (!providerKey) {
    return null;
  }

  const { byUrl, byProgramId } = buildProgramUrlIndex(registry);
  const normalized = normalizeTrackingUrl(parsed.href);
  const byExactUrl = byUrl.get(normalized);
  if (byExactUrl) {
    return byExactUrl;
  }

  const programId = extractProgramIdFromUrl(urlString, providerKey);
  if (!programId) {
    return null;
  }

  return byProgramId.get(`${providerKey}:${programId}`) ?? null;
}

/**
 * @param {string} content
 * @param {object} registry
 * @returns {{ content: string, replacements: object[], unmapped: object[] }}
 */
export function migrateMarkdownLinks(content, registry) {
  const replacements = [];
  const unmapped = [];

  const nextContent = content.replace(MARKDOWN_LINK_PATTERN, (match, label, url) => {
    if (!isAspTrackingUrl(url, registry)) {
      return match;
    }

    const programKey = resolveProgramKeyFromUrl(url, registry);
    if (!programKey) {
      unmapped.push({ url, label });
      return match;
    }

    replacements.push({ url, programKey, label });
    return `[${label}]({AFFILIATE:${programKey}})`;
  });

  return { content: nextContent, replacements, unmapped };
}

/**
 * @param {string} content
 * @param {object} registry
 * @returns {{ url: string, line: number }[]}
 */
export function findHardcodedAspUrls(content, registry) {
  const lines = content.split("\n");
  const found = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const matches = [...line.matchAll(MARKDOWN_LINK_PATTERN)];
    for (const match of matches) {
      const url = match[2];
      if (AFFILIATE_PLACEHOLDER_PATTERN.test(url)) {
        continue;
      }
      if (isAspTrackingUrl(url, registry)) {
        found.push({ url, line: index + 1 });
      }
    }
  }

  return found;
}

export function daysSinceIsoDate(isoDate, referenceDate = todayIsoDate()) {
  if (!isoDate || typeof isoDate !== "string") {
    return null;
  }
  const start = Date.parse(`${isoDate}T00:00:00Z`);
  const end = Date.parse(`${referenceDate}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  return Math.floor((end - start) / (24 * 60 * 60 * 1000));
}

export function buildLastVerifiedAlert(
  program,
  programKey,
  alertDays = DEFAULT_LAST_VERIFIED_ALERT_DAYS,
) {
  if (program.status !== "active" || !program.trackingUrl) {
    return null;
  }

  const days = daysSinceIsoDate(program.lastVerified);
  if (days === null) {
    return {
      programKey,
      type: "missing-lastVerified",
      message: `${programKey}: lastVerified is missing`,
    };
  }
  if (days > alertDays) {
    return {
      programKey,
      type: "stale-lastVerified",
      message: `${programKey}: lastVerified is ${days} days old (${program.lastVerified})`,
      days,
    };
  }
  return null;
}

/**
 * @param {string} trackingUrl
 * @param {typeof fetch} fetchFn
 * @param {{ timeoutMs?: number }} [options]
 */
export async function probeTrackingUrl(
  trackingUrl,
  fetchFn = fetch,
  { timeoutMs = 15000 } = {},
) {
  async function request(method) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchFn(trackingUrl, {
        method,
        redirect: "follow",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  try {
    let response = await request("HEAD");

    if (response.status === 405 || response.status === 501) {
      response = await request("GET");
    }

    return {
      ok: response.ok,
      status: response.status,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * @param {object} registry
 * @param {{ fetchFn?: typeof fetch, alertDays?: number, referenceDate?: string }} [options]
 */
export async function runAffiliateHealthCheck(registry, options = {}) {
  const fetchFn = options.fetchFn ?? fetch;
  const alertDays = options.alertDays ?? DEFAULT_LAST_VERIFIED_ALERT_DAYS;
  const referenceDate = options.referenceDate ?? todayIsoDate();
  const programs = {};
  const alerts = [];

  for (const [programKey, program] of Object.entries(registry.programs ?? {})) {
    const staleAlert = buildLastVerifiedAlert(program, programKey, alertDays);
    if (staleAlert) {
      alerts.push(staleAlert);
    }

    if (!program.trackingUrl || program.status !== "active") {
      programs[programKey] = {
        label: program.label,
        status: program.status ?? "unknown",
        trackingUrl: program.trackingUrl ?? null,
        lastVerified: program.lastVerified ?? null,
        daysSinceVerified: daysSinceIsoDate(program.lastVerified, referenceDate),
        probe: null,
        alert: staleAlert?.type ?? null,
      };
      continue;
    }

    const probe = await probeTrackingUrl(program.trackingUrl, fetchFn);
    if (!probe.ok) {
      alerts.push({
        programKey,
        type: "probe-failed",
        message: `${programKey}: trackingUrl probe failed (${probe.status ?? probe.error})`,
        probe,
      });
    }

    programs[programKey] = {
      label: program.label,
      status: program.status,
      trackingUrl: program.trackingUrl,
      lastVerified: program.lastVerified ?? null,
      daysSinceVerified: daysSinceIsoDate(program.lastVerified, referenceDate),
      probe,
      alert: staleAlert?.type ?? (probe.ok ? null : "probe-failed"),
    };
  }

  return {
    version: 1,
    generatedAt: referenceDate,
    alertDays,
    programs,
    alerts,
    summary: {
      totalPrograms: Object.keys(programs).length,
      alertCount: alerts.length,
      probeFailures: alerts.filter((alert) => alert.type === "probe-failed").length,
      staleLastVerified: alerts.filter((alert) => alert.type === "stale-lastVerified")
        .length,
    },
  };
}
