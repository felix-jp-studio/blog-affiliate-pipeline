import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type AffiliateRules = {
  carriers: Record<string, { label: string; linkTemplate: string }>;
  articleTypes: Record<string, { minLinks: number; requiredCarriers: string[] }>;
  forbiddenPhrases?: string[];
};

export function loadAffiliateRules(path: string): AffiliateRules {
  const raw = readFileSync(resolve(path), "utf8");
  return JSON.parse(raw) as AffiliateRules;
}

export function injectAffiliateLinks(
  html: string,
  articleType: string,
  rulesPath: string,
): string {
  const rules = loadAffiliateRules(rulesPath);
  const typeRule = rules.articleTypes[articleType] ?? rules.articleTypes.howto;
  const carriers = typeRule.requiredCarriers.length
    ? typeRule.requiredCarriers
    : Object.keys(rules.carriers).slice(0, typeRule.minLinks);

  const links = carriers
    .map((id) => {
      const carrier = rules.carriers[id];
      if (!carrier) return "";
      return `<p><a href="${carrier.linkTemplate}" rel="sponsored noopener">${carrier.label} 公式サイト</a></p>`;
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
