export type ArticleType =
  | "comparison"
  | "howto"
  | "troubleshoot"
  | "crosssell";

export const articleTypeLabels: Record<ArticleType, string> = {
  comparison: "比較",
  howto: "手順",
  troubleshoot: "トラブル解決",
  crosssell: "固定費・セット",
};
