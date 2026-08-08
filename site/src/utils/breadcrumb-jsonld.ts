import type { BreadcrumbItem } from "../data/site-nav";

export function buildBreadcrumbJsonLd(
  breadcrumbs: BreadcrumbItem[],
  siteUrl: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: new URL(item.href, siteUrl).href } : {}),
    })),
  };
}
