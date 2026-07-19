export type CategorySlug = "sim" | "hikari" | "trouble";

export type CategoryMeta = {
  label: string;
  href: string;
  description: string;
  heroLead: string;
  themeColor: string;
  gradient: string;
};

export const categoryMeta: Record<CategorySlug, CategoryMeta> = {
  sim: {
    label: "格安SIM",
    href: "/sim",
    description: "格安SIMの比較・乗り換え・お困り解決記事一覧",
    heroLead: "乗り換え・MNP・料金比較など、格安SIMに関する記事です。",
    themeColor: "#0b6bcb",
    gradient: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)",
  },
  hikari: {
    label: "光回線",
    href: "/hikari",
    description: "光回線の比較・乗り換え・セット割",
    heroLead: "乗り換え・セット割・キャンペーンなど、光回線に関する記事です。",
    themeColor: "#059669",
    gradient: "linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)",
  },
  trouble: {
    label: "お困り系",
    href: "/trouble",
    description: "速度・開通などお困りごとの対処記事一覧",
    heroLead: "速度低下・開通遅延など、よくあるお困りごとの対処記事です。",
    themeColor: "#d97706",
    gradient: "linear-gradient(135deg, #ffedd5 0%, #fdba74 100%)",
  },
};
