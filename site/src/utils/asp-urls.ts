import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type AspProvider = {
  displayName: string;
  status: string;
  tracking: {
    hostPattern?: string | null;
  };
};

type AspUrlsRegistry = {
  providers: Record<string, AspProvider>;
};

const registry = JSON.parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../../../config/asp-urls.json",
    ),
    "utf8",
  ),
) as AspUrlsRegistry;

const DEFAULT_AFFILIATE_HOSTS = ["px.a8.net", "valuecommerce.com"];

export function affiliateHostPatterns(): string[] {
  const patterns = Object.values(registry.providers)
    .filter((provider) => provider.status === "active")
    .map((provider) => provider.tracking.hostPattern)
    .filter((host): host is string => Boolean(host));
  return patterns.length > 0 ? patterns : DEFAULT_AFFILIATE_HOSTS;
}

export function affiliateUrlPattern(): RegExp {
  const hosts = affiliateHostPatterns();
  if (hosts.length === 0) {
    return /(?!)/;
  }
  return new RegExp(hosts.map((host) => host.replace(/\./g, "\\.")).join("|"));
}
