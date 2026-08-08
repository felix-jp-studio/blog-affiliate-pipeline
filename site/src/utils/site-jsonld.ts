export const SITE_NAME = "SIM・光回線ガイド";

export const SITE_DESCRIPTION =
  "格安SIM・光回線の比較・乗り換え・お困り解決ガイド。料金・速度・セット割を中立に整理します。";

export function buildWebSiteJsonLd(siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: "ja-JP",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
  };
}

export function buildOrganizationJsonLd(siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: "ja-JP",
  };
}
