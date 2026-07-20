import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type AspProvider = {
  displayName: string;
  status: string;
  lastVerified?: string;
  portal: {
    registration?: string;
    management?: string;
  };
  tracking: {
    hostPattern?: string | null;
    urlTemplate?: string | null;
  };
  siteId?: string;
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

export type AspUrlsRegistry = {
  version: number;
  updatedAt?: string;
  providers: Record<string, AspProvider>;
  programs: Record<string, AspProgram>;
};

export function loadAspUrls(path: string): AspUrlsRegistry {
  const raw = readFileSync(resolve(path), "utf8");
  return JSON.parse(raw) as AspUrlsRegistry;
}

export function resolveProgramUrl(registry: AspUrlsRegistry, programId: string): string {
  const program = registry.programs[programId];
  if (!program) return "#";
  return program.trackingUrl ?? program.fallbackUrl ?? "#";
}

export function resolveCarrierUrl(
  registry: AspUrlsRegistry,
  carrier: { program?: string; linkTemplate?: string },
): string {
  if (carrier.program) {
    return resolveProgramUrl(registry, carrier.program);
  }
  return carrier.linkTemplate ?? "#";
}

export function affiliateHostPatterns(registry: AspUrlsRegistry): string[] {
  const DEFAULT_AFFILIATE_HOSTS = ["px.a8.net", "valuecommerce.com"];
  const patterns = Object.values(registry.providers)
    .filter((provider) => provider.status === "active")
    .map((provider) => provider.tracking.hostPattern)
    .filter((host): host is string => Boolean(host));
  return patterns.length > 0 ? patterns : DEFAULT_AFFILIATE_HOSTS;
}
