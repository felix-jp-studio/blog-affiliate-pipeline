import type { CategorySlug } from "./category-meta";

export type HubComparisonColumn = {
  key: string;
  label: string;
};

export type HubComparisonRow = Record<string, string>;

export type HubAspOffer = {
  programId: string;
  description: string;
  ctaLabel?: string;
};

export type HubAspSection = {
  comparisonTitle: string;
  comparisonNote: string;
  comparisonColumns: HubComparisonColumn[];
  comparisonRows: HubComparisonRow[];
  ctaTitle: string;
  offers: HubAspOffer[];
};

export const hubAspSections: Partial<Record<CategorySlug, HubAspSection>> = {
  sim: {
    comparisonTitle: "主力格安SIM比較（2026年版）",
    comparisonNote:
      "※ 料金・キャンペーンは変更されるため、表は比較の観点整理です。数値は各公式サイトで要確認です。",
    comparisonColumns: [
      { key: "name", label: "キャリア" },
      { key: "monthlyFee", label: "月額目安" },
      { key: "data", label: "データ容量" },
      { key: "call", label: "通話" },
      { key: "network", label: "回線系" },
      { key: "note", label: "備考" },
    ],
    comparisonRows: [
      {
        name: "楽天モバイル",
        monthlyFee: "要公式確認",
        data: "段階制",
        call: "オプション",
        network: "楽天回線",
        note: "公式（2026/07）",
      },
      {
        name: "LINEMO",
        monthlyFee: "要公式確認",
        data: "容量別",
        call: "アプリ通話",
        network: "SB系",
        note: "公式（2026/07）",
      },
    ],
    ctaTitle: "主力格安SIMの公式確認",
    offers: [
      {
        programId: "rakuten-mobile",
        description:
          "データ利用量に応じた段階制料金。楽天経済圏とのセット利用を検討する方向け。",
      },
      {
        programId: "linemo",
        description:
          "ソフトバンク系オンライン専用プラン。シンプルな容量別プランで比較しやすい。",
      },
    ],
  },
  hikari: {
    comparisonTitle: "主力回線比較（2026年版）",
    comparisonNote:
      "※ 料金・キャンペーンは変更されるため、表は比較の観点整理です。数値は各公式サイトで要確認です。",
    comparisonColumns: [
      { key: "name", label: "回線" },
      { key: "monthlyFee", label: "月額目安" },
      { key: "construction", label: "工事" },
      { key: "setDiscount", label: "セット割" },
      { key: "note", label: "備考" },
    ],
    comparisonRows: [
      {
        name: "auひかり",
        monthlyFee: "要公式確認",
        construction: "戸建中心",
        setDiscount: "au/UQセット割",
        note: "公式（2026/07）",
      },
      {
        name: "ソフトバンク光",
        monthlyFee: "要公式確認",
        construction: "戸建・マンション",
        setDiscount: "SB/Y!mobile/LINEMO",
        note: "公式（2026/07）",
      },
      {
        name: "WiMAX",
        monthlyFee: "要公式確認",
        construction: "工事不要（据置型）",
        setDiscount: "要確認",
        note: "公式（2026/07）",
      },
    ],
    ctaTitle: "主力回線の公式確認",
    offers: [
      {
        programId: "au-hikari",
        description:
          "au/UQ mobileのセット割と組み合わせやすい光回線。戸建て向けプランが中心。",
      },
      {
        programId: "softbank-hikari",
        description:
          "ソフトバンク/Y!mobile/LINEMOとのセット割がポイント。プロバイダで月額が変わる。",
      },
      {
        programId: "wimax",
        description:
          "工事不要で据置型端末を置くだけ。光回線が難しい物件や短期利用の選択肢。",
      },
    ],
  },
  cost: {
    comparisonTitle: "通信×固定費セット見直し比較",
    comparisonNote:
      "※ セット割の対象回線・適用条件は複雑です。公式シミュレーターで前提条件を揃えて確認してください。",
    comparisonColumns: [
      { key: "name", label: "サービス" },
      { key: "category", label: "カテゴリ" },
      { key: "setDiscount", label: "セット割のポイント" },
      { key: "note", label: "備考" },
    ],
    comparisonRows: [
      {
        name: "楽天モバイル",
        category: "格安SIM",
        setDiscount: "楽天経済圏との併用",
        note: "通信単体の見直し",
      },
      {
        name: "LINEMO",
        category: "格安SIM",
        setDiscount: "ソフトバンク光セット割",
        note: "光×SIMセット",
      },
      {
        name: "auひかり",
        category: "光回線",
        setDiscount: "au/UQ mobileセット割",
        note: "光×SIMセット",
      },
      {
        name: "ソフトバンク光",
        category: "光回線",
        setDiscount: "SB/Y!mobile/LINEMO",
        note: "光×SIMセット",
      },
      {
        name: "WiMAX",
        category: "ホーム回線",
        setDiscount: "要確認",
        note: "工事不要の選択肢",
      },
    ],
    ctaTitle: "セット見直しの公式確認",
    offers: [
      {
        programId: "rakuten-mobile",
        description:
          "通信料の見直し起点として。楽天経済圏との併用条件を公式で確認。",
      },
      {
        programId: "linemo",
        description:
          "ソフトバンク光とのセット割を検討する場合の格安SIM候補。",
      },
      {
        programId: "au-hikari",
        description:
          "au/UQ mobile利用者向け。光回線とスマホのセット割条件を公式で照合。",
      },
      {
        programId: "softbank-hikari",
        description:
          "ソフトバンク/Y!mobile/LINEMO利用者向け。セット割の対象プランを確認。",
      },
      {
        programId: "wimax",
        description:
          "光回線の工事が難しい場合の代替。据置型で短期・引越し向けも検討可。",
      },
    ],
  },
};

export function getHubAspSection(
  category: CategorySlug,
): HubAspSection | undefined {
  return hubAspSections[category];
}
