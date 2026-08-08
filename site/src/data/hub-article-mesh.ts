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
    intro:
      "格安SIMカテゴリの代表的な比較・乗り換え・用途別おすすめ記事です。まずは総合比較かキャリア比較から確認してください。",
    featured: [
      {
        slug: "sim-osusume-hikaku-2026",
        label: "2026年版 格安SIM比較",
      },
      {
        slug: "sim-carrier-hikaku",
        label: "キャリア vs MVNO 比較",
      },
      {
        slug: "sim-norikae-osusume",
        label: "格安SIM 乗り換えおすすめ",
      },
      {
        slug: "sim-5g-taiou-hikaku",
        label: "5G対応 格安SIM比較",
      },
      {
        slug: "sim-senior-osusume",
        label: "シニア向け格安SIM",
      },
      {
        slug: "sim-20gb-osusume",
        label: "20GBプランの選び方",
      },
      {
        slug: "mineo-hyoban-demerit",
        label: "mineo 評判・デメリット",
      },
      {
        slug: "nihon-tsushin-sim-hyoban",
        label: "日本通信SIM 評判",
      },
      {
        slug: "povo-data-yoryou-tsuika-houhou",
        label: "povo データ容量追加",
      },
      {
        slug: "ahamo-oomori-option-moushikomi-tejun",
        label: "ahamo 大盛りオプション手順",
      },
    ],
  },
  hikari: {
    hubLabel: "光回線",
    hubHref: "/hikari",
    intro:
      "光回線カテゴリの代表的な比較・乗り換え・戸建て/マンション別記事です。エリアと工事条件を確認してから比較表をご覧ください。",
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
      {
        slug: "hikari-kodate-osusume",
        label: "戸建て向け光回線",
      },
      {
        slug: "nuro-hikari-au-hikari-hikaku",
        label: "NURO光 vs auひかり",
      },
      {
        slug: "hikari-1gbps-yasui",
        label: "1Gbps 安い光回線",
      },
    ],
  },
  trouble: {
    hubLabel: "お困り系",
    hubHref: "/trouble",
    intro:
      "速度低下・開通遅延・障害確認など、よくあるトラブルへの対処記事です。症状に近い記事から確認してください。",
    featured: [
      {
        slug: "sim-speed-slow-fix",
        label: "格安SIM 速度が遅いとき",
      },
      {
        slug: "povo-speed-slow-fix",
        label: "povo 速度が遅いとき",
      },
      {
        slug: "iijmio-speed-slow-fix",
        label: "IIJmio 速度が遅いとき",
      },
      {
        slug: "wifi-speed-slow-kaizen",
        label: "Wi-Fi速度の改善",
      },
      {
        slug: "hikari-kaituu-itsu",
        label: "光回線 開通までの日数",
      },
      {
        slug: "softbank-hikari-shogai-kakunin",
        label: "ソフトバンク光 障害確認",
      },
    ],
  },
  cost: {
    hubLabel: "固定費・ライフイベント",
    hubHref: "/cost",
    intro:
      "通信×固定費セット見直しの代表記事です。電気料金と通信料をセットで比較する前に、対象回線と適用条件を確認してください。",
    featured: [
      {
        slug: "au-denki-setwari",
        label: "auでんき セット割",
      },
      {
        slug: "rakuten-denki-rakuten-mobile",
        label: "楽天でんき × 楽天モバイル",
      },
      {
        slug: "au-denki-fee-hikaku",
        label: "auでんき 料金比較",
      },
      {
        slug: "family-2-lines-cheap",
        label: "家族2回線を安くする",
      },
    ],
  },
};

export function getHubArticleMesh(
  category: CategorySlug,
): HubArticleMesh | undefined {
  return hubArticleMesh[category];
}

/** One top featured article per category for the homepage. */
export function getHomeFeaturedArticles(): Array<
  HubFeaturedArticle & { category: CategorySlug }
> {
  const categories: CategorySlug[] = ["sim", "hikari", "trouble", "cost"];
  const featured: Array<HubFeaturedArticle & { category: CategorySlug }> = [];

  for (const category of categories) {
    const mesh = hubArticleMesh[category];
    const top = mesh?.featured[0];
    if (top) {
      featured.push({ ...top, category });
    }
  }

  return featured;
}
