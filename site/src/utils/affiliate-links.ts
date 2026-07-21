import {
  affiliateUrlPattern,
  hasAffiliatePlaceholder,
} from "./asp-urls";

export function hasAffiliateLinks(markdown: string): boolean {
  return (
    affiliateUrlPattern().test(markdown) || hasAffiliatePlaceholder(markdown)
  );
}
