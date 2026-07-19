export type CategorySlug = "sim" | "hikari" | "trouble";

export type CategoryMeta = {
  label: string;
  href: string;
  description: string;
};

export const categoryMeta: Record<CategorySlug, CategoryMeta> = {
  sim: {
    label: "格安SIM",
    href: "/sim",
    description: "格安SIMの比較・乗り換え・お困り解決記事一覧",
  },
  hikari: {
    label: "光回線",
    href: "/hikari",
    description: "光回線の比較・乗り換え・セット割",
  },
  trouble: {
    label: "お困り系",
    href: "/trouble",
    description: "速度・開通などお困りごとの対処記事一覧",
  },
};
