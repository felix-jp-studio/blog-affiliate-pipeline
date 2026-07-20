import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadAspUrls, resolveCarrierUrl } from "./aspUrls.js";

type AffiliateRules = {
  carriers: Record<string, { label: string; program?: string; linkTemplate?: string }>;
  articleTypes: Record<string, { minLinks: number; requiredCarriers: string[] }>;
  forbiddenPhrases?: string[];
};

function defaultAspUrlsPath(rulesPath: string): string {
  return resolve(dirname(rulesPath), "asp-urls.json");
}

export function loadAffiliateRules(path: string): AffiliateRules {
  const raw = readFileSync(resolve(path), "utf8");
  return JSON.parse(raw) as AffiliateRules;
}

export function injectAffiliateLinks(
  html: string,
  articleType: string,
  rulesPath: string,
  aspUrlsPath = defaultAspUrlsPath(rulesPath),
): string {
  const rules = loadAffiliateRules(rulesPath);
  const aspUrls = loadAspUrls(aspUrlsPath);
  const typeRule = rules.articleTypes[articleType] ?? rules.articleTypes.howto;
  const carriers = typeRule.requiredCarriers.length
    ? typeRule.requiredCarriers
    : Object.keys(rules.carriers).slice(0, typeRule.minLinks);

  const links = carriers
    .map((id) => {
      const carrier = rules.carriers[id];
      if (!carrier) return "";
      const href = resolveCarrierUrl(aspUrls, carrier);
      return `<p><a href="${href}" rel="sponsored noopener">${carrier.label} 公式サイト</a></p>`;
    })
    .filter(Boolean)
    .join("\n");

  if (!links) return html;
  return `${html}\n<hr />\n<section data-affiliate-injected="true">\n<h2>関連リンク</h2>\n${links}\n</section>`;
}

export function assertNoForbiddenPhrases(content: string, rulesPath: string): void {
  const rules = loadAffiliateRules(rulesPath);
  for (const phrase of rules.forbiddenPhrases ?? []) {
    if (content.includes(phrase)) {
      throw new Error(`禁止表現が含まれています: ${phrase}`);
    }
  }
}
