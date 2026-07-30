import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type AspProvider = {
  displayName: string;
  status: string;
  tracking: {
    hostPattern?: string | null;
  };
};

type AspProgram = {
  label: string;
  category: string;
  provider: string;
  programId?: string;
  trackingUrl?: string;
  fallbackUrl?: string;
  status: string;
  lastVerified?: string;
};

type AspUrlsRegistry = {
  providers: Record<string, AspProvider>;
  programs: Record<string, AspProgram>;
};

type AffiliateCarrier = {
  label: string;
  program?: string;
  linkTemplate?: string;
};

type AffiliateRules = {
  carriers: Record<string, AffiliateCarrier>;
};

function resolveConfigDir(): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // Prefer site-local config (Vercel Root Directory = site).
    join(moduleDir, "../../config"),
    join(process.cwd(), "config"),
    // Monorepo root config (local CI / repo-root tooling).
    join(moduleDir, "../../../config"),
    join(process.cwd(), "../config"),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, "asp-urls.json"))) {
      return dir;
    }
  }
  return candidates[0];
}

const configDir = resolveConfigDir();

const registry = JSON.parse(
  readFileSync(join(configDir, "asp-urls.json"), "utf8"),
) as AspUrlsRegistry;

let cachedAffiliateRules: AffiliateRules | null = null;

export function loadAffiliateRules(): AffiliateRules {
  if (!cachedAffiliateRules) {
    cachedAffiliateRules = JSON.parse(
      readFileSync(join(configDir, "affiliate-rules.json"), "utf8"),
    ) as AffiliateRules;
  }
  return cachedAffiliateRules;
}

export function resolveProgramUrl(programId: string): string {
  const program = registry.programs[programId];
  if (!program) {
    return "#";
  }
  return program.trackingUrl ?? program.fallbackUrl ?? "#";
}

export function resolveProgramLabel(programId: string): string {
  return registry.programs[programId]?.label ?? programId;
}

export function resolveCarrierUrl(carrier: AffiliateCarrier): string {
  if (carrier.program) {
    return resolveProgramUrl(carrier.program);
  }
  return carrier.linkTemplate ?? "#";
}

const DEFAULT_AFFILIATE_HOSTS = ["px.a8.net", "valuecommerce.com"];

export function affiliateHostPatterns(): string[] {
  const patterns = Object.values(registry.providers)
    .filter((provider) => provider.status === "active")
    .map((provider) => provider.tracking.hostPattern)
    .filter((host): host is string => Boolean(host));
  return patterns.length > 0 ? patterns : DEFAULT_AFFILIATE_HOSTS;
}

const AFFILIATE_PLACEHOLDER_PATTERN = /\{\{?AFFILIATE:[a-z0-9-]+\}\}?/;

export function hasAffiliatePlaceholder(markdown: string): boolean {
  return AFFILIATE_PLACEHOLDER_PATTERN.test(markdown);
}

export function affiliateUrlPattern(): RegExp {
  const hosts = affiliateHostPatterns();
  if (hosts.length === 0) {
    return /(?!)/;
  }
  return new RegExp(hosts.map((host) => host.replace(/\./g, "\\.")).join("|"));
}
