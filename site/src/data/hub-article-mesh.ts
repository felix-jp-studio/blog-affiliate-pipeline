import type { CategorySlug } from "./category-meta";

export type HubFeaturedArticle = {
  slug: string;
  label: string;
};

export type HubArticleMesh = {
  hubLabel: string;
  hubHref: string;
  intro: string;
  featured: HubFeaturedArticle[];
};

/** Fixed Hub ↔ article link mesh for primary category hubs. */
export const hubArticleMesh: Partial<Record<CategorySlug, HubArticleMesh>> = {
  sim: {
    hubLabel: "格安SIM",
    hubHref: "/sim",
    intro: "格安SIMカテゴリの代表的な比較・手順記事です。",
    featured: [
      {
        slug: "sim-osusume-hikaku-2026",
        label: "2026年版 格安SIM比較",
      },
      {
        slug: "sim-20gb-osusume",
        label: "20GBプランの選び方",
      },
      {
        slug: "rakuten-mobile-switch",
        label: "楽天モバイル乗り換え手順",
      },
    ],
  },
  hikari: {
    hubLabel: "光回線",
    hubHref: "/hikari",
    intro: "光回線カテゴリの代表的な比較・乗り換え記事です。",
    featured: [
      {
        slug: "hikari-switch-osusume",
        label: "光回線の乗り換えおすすめ",
      },
      {
        slug: "nuro-hikari-campaign",
        label: "NURO光 料金・キャンペーン",
      },
      {
        slug: "hikari-mansion-osusume",
        label: "マンション向け光回線",
      },
    ],
  },
  cost: {
    hubLabel: "固定費・ライフイベント",
    hubHref: "/cost",
    intro: "通信×固定費セット見直しの代表記事です。",
    featured: [
      {
        slug: "au-denki-setwari",
        label: "auでんき セット割",
      },
      {
        slug: "rakuten-denki-rakuten-mobile",
        label: "楽天でんき × 楽天モバイル",
      },
    ],
  },
};

export function getHubArticleMesh(
  category: CategorySlug,
): HubArticleMesh | undefined {
  return hubArticleMesh[category];
}
