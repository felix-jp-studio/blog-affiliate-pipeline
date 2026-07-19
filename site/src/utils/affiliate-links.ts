const AFFILIATE_URL_PATTERN = /px\.a8\.net|valuecommerce\.com/;

export function hasAffiliateLinks(markdown: string): boolean {
  return AFFILIATE_URL_PATTERN.test(markdown);
}
