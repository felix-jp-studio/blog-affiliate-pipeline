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
        slug: "sim-unlimited-data",
        label: "データ無制限 格安SIM",
      },
      {
        slug: "sim-gakusei-osusume",
        label: "学生向け 格安SIM",
      },
      {
        slug: "sim-kodomo-osusume",
        label: "子供向け 格安SIM",
      },
      {
        slug: "sim-houjin-osusume",
        label: "法人向け 格安SIM",
      },
      {
        slug: "sim-fukukaisen-osusume",
        label: "格安SIM 副回線",
      },
      {
        slug: "sim-tethering-osusume",
        label: "テザリング 格安SIM",
      },
      {
        slug: "sim-kakehoudai-yasui",
        label: "通話かけ放題 安い比較",
      },
      {
        slug: "sim-tuuwa-teigaku-hikaku",
        label: "通話定額 比較",
      },
      {
        slug: "smartphone-setwari-hikaku",
        label: "スマホ セット割 比較",
      },
      {
        slug: "mnp-reservation-number",
        label: "MNP予約番号 取得方法",
      },
      {
        slug: "rakuten-mobile-switch",
        label: "楽天モバイル 乗り換え",
      },
      {
        slug: "esim-norikae-sokujitsu",
        label: "eSIM 乗り換え 即日",
      },
      {
        slug: "ahamo-kaiyaku-tejun",
        label: "ahamo 解約手順",
      },
      {
        slug: "uq-mobile-kaiyaku-tejun",
        label: "UQモバイル 解約手順",
      },
      {
        slug: "esim-kishu-henkou-tejun",
        label: "eSIM 機種変更手順",
      },
      {
        slug: "sim-tethering-settei-houhou",
        label: "格安SIM テザリング設定",
      },
      {
        slug: "rakuten-mobile-mnp-tejun",
        label: "楽天モバイル MNP手順",
      },
      {
        slug: "linemo-kaiyaku-tejun",
        label: "LINEMO 解約手順",
      },
      {
        slug: "sim-kishu-henkou-tejun",
        label: "格安SIM 機種変更",
      },
      {
        slug: "ahamo-esim-settei-tejun",
        label: "ahamo eSIM 設定",
      },
      {
        slug: "uq-mobile-esim-settei-tejun",
        label: "UQモバイル eSIM 設定",
      },
      {
        slug: "povo-esim-settei-tejun",
        label: "povo eSIM 設定",
      },
      {
        slug: "mineo-esim-settei-tejun",
        label: "mineo eSIM 設定",
      },
      {
        slug: "linemo-esim-settei-tejun",
        label: "LINEMO eSIM 設定",
      },
      {
        slug: "povo-kaiyaku-tejun",
        label: "povo 解約手順",
      },
      {
        slug: "iphone-sono-mama-sim",
        label: "iPhone そのまま 格安SIM",
      },
      {
        slug: "ahamo-povo-hikaku",
        label: "ahamo vs povo 比較",
      },
      {
        slug: "linemo-ahamo-hikaku",
        label: "LINEMO vs ahamo 比較",
      },
      {
        slug: "rakuten-mobile-uq-mobile-hikaku",
        label: "楽天モバイル vs UQ",
      },
      {
        slug: "mineo-hyoban-demerit",
        label: "mineo 評判・デメリット",
      },
      {
        slug: "linemo-hyoban-demerit",
        label: "LINEMO 評判・デメリット",
      },
      {
        slug: "iijmio-hyoban-fee",
        label: "IIJmio 評判・料金",
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
      {
        slug: "home-router-hikari-hikaku",
        label: "ホームルーター vs 光回線",
      },
      {
        slug: "home-router-hitorigurashi",
        label: "一人暮らし ホームルーター",
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
      {
        slug: "hikari-provider-chigai",
        label: "プロバイダの違い",
      },
      {
        slug: "kouji-fuyou-hikari",
        label: "工事不要 光回線",
      },
      {
        slug: "hikkoshi-hikari-tetsuzuki",
        label: "引っ越し 光回線手続き",
      },
      {
        slug: "hikari-kaituu-junbi-tejun",
        label: "光回線 開通準備",
      },
      {
        slug: "au-hikari-kaiyaku-houhou",
        label: "auひかり 解約方法",
      },
      {
        slug: "docomo-kaiyaku-tejun",
        label: "docomo光 解約手順",
      },
      {
        slug: "biglobe-hikari-kaiyaku-tejun",
        label: "ビッグローブ光 解約手順",
      },
      {
        slug: "nuro-hikari-kaiyaku-tejun",
        label: "NURO光 解約手順",
      },
      {
        slug: "docomo-hikari-hikari-collab-hikaku",
        label: "ドコモ光 vs 光コラボ",
      },
      {
        slug: "softbank-hikari-biglobe-hikari-hikaku",
        label: "SB光 vs ビッグローブ光",
      },
      {
        slug: "wimax-fee-hikaku-2026",
        label: "WiMAX 料金比較 2026",
      },
      {
        slug: "mobareco-air-wimax-hikaku",
        label: "モバレコAir vs WiMAX",
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
      {
        slug: "ahamo-moushikomi-error-fix",
        label: "ahamo 申し込みエラー",
      },
      {
        slug: "povo-seikyu-kingaku-awanai-fix",
        label: "povo 請求金額不一致",
      },
      {
        slug: "wimax-kaiyaku-dekinai-fix",
        label: "WiMAX 解約できない",
      },
      {
        slug: "sim-tsunagaranai-fix",
        label: "格安SIM 繋がらない",
      },
      {
        slug: "hikari-kaituu-slow-fix",
        label: "光回線 開通遅い",
      },
      {
        slug: "iijmio-kaituu-dekinai-fix",
        label: "IIJmio 開通できない",
      },
      {
        slug: "tethering-dekinai-fix",
        label: "テザリング できない",
      },
      {
        slug: "mnp-error-fix",
        label: "MNP エラー 対処",
      },
      {
        slug: "ahamo-speed-slow-fix",
        label: "ahamo 速度 遅い",
      },
      {
        slug: "nuro-hikari-tsunagaranai-fix",
        label: "NURO光 繋がらない",
      },
      {
        slug: "sim-kengai-hyoji-fix",
        label: "格安SIM 圏外表示",
      },
      {
        slug: "hikari-wifi-tsunagaranai-fix",
        label: "光回線 WiFi 繋がらない",
      },
      {
        slug: "linemo-kaituu-dekinai-fix",
        label: "LINEMO 開通できない",
      },
      {
        slug: "mineo-kaituu-dekinai-fix",
        label: "mineo 開通できない",
      },
      {
        slug: "ahamo-kaituu-dekinai-fix",
        label: "ahamo 開通できない",
      },
      {
        slug: "uq-mobile-kaituu-dekinai-fix",
        label: "UQモバイル 開通できない",
      },
      {
        slug: "povo-kaituu-dekinai-fix",
        label: "povo 開通できない",
      },
      {
        slug: "wimax-speed-slow-fix",
        label: "WiMAX 速度 遅い",
      },
      {
        slug: "home-router-speed-slow-fix",
        label: "ホームルーター 速度 遅い",
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
        slug: "rakuten-denki-fee",
        label: "楽天でんき 料金",
      },
      {
        slug: "family-2-lines-cheap",
        label: "家族2回線を安くする",
      },
    ],
  },
};

/** Homepage picks: 2 per category, howto/troubleshoot prioritized where available. */
const homeFeaturedSlugs: Partial<Record<CategorySlug, string[]>> = {
  sim: ["sim-osusume-hikaku-2026", "mnp-reservation-number"],
  hikari: ["hikari-switch-osusume", "hikkoshi-hikari-tetsuzuki"],
  trouble: ["sim-speed-slow-fix", "wifi-speed-slow-kaizen"],
  cost: ["au-denki-setwari", "rakuten-denki-fee"],
};

export function getHubArticleMesh(
  category: CategorySlug,
): HubArticleMesh | undefined {
  return hubArticleMesh[category];
}

/** Two featured articles per category for the homepage (8 total). */
export function getHomeFeaturedArticles(): Array<
  HubFeaturedArticle & { category: CategorySlug }
> {
  const categories: CategorySlug[] = ["sim", "hikari", "trouble", "cost"];
  const featured: Array<HubFeaturedArticle & { category: CategorySlug }> = [];

  for (const category of categories) {
    const mesh = hubArticleMesh[category];
    if (!mesh) {
      continue;
    }

    const slugIndex = new Map(
      mesh.featured.map((item) => [item.slug, item] as const),
    );
    const picks =
      homeFeaturedSlugs[category] ??
      mesh.featured.slice(0, 2).map((item) => item.slug);

    for (const slug of picks) {
      const item = slugIndex.get(slug);
      if (item) {
        featured.push({ ...item, category });
      }
    }
  }

  return featured;
}
