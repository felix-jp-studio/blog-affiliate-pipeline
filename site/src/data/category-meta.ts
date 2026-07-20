export type CategorySlug = "sim" | "hikari" | "trouble" | "cost";

export type CategoryMeta = {
  label: string;
  href: string;
  description: string;
  heroLead: string;
  guideText: string;
  themeColor: string;
  gradient: string;
  ogImage: string;
};

export const defaultOgImage = "/og/og-default.png";

export const categoryMeta: Record<CategorySlug, CategoryMeta> = {
  sim: {
    label: "格安SIM",
    href: "/sim",
    description: "格安SIMの比較・乗り換え・お困り解決記事一覧",
    heroLead: "乗り換え・MNP・料金比較など、格安SIMに関する記事です。",
    guideText:
      "月間データ量・通話の使い方・セット割の条件を先に整理しましょう。料金だけでなくエリアと速度の安定性も公式情報で確認し、キャンペーンは適用条件まで必ず照合してください。",
    themeColor: "#0b6bcb",
    gradient: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)",
    ogImage: "/og/og-sim.png",
  },
  hikari: {
    label: "光回線",
    href: "/hikari",
    description: "光回線の比較・乗り換え・セット割",
    heroLead: "乗り換え・セット割・キャンペーンなど、光回線に関する記事です。",
    guideText:
      "提供エリア・工事の有無・解約金・セット割の対象回線を先に確認しましょう。月額だけでなく初期費用とキャッシュバック条件も含めて、公式サイトの最新情報で比較してください。",
    themeColor: "#059669",
    gradient: "linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)",
    ogImage: "/og/og-hikari.png",
  },
  trouble: {
    label: "お困り系",
    href: "/trouble",
    description: "速度・開通などお困りごとの対処記事一覧",
    heroLead: "速度低下・開通遅延など、よくあるお困りごとの対処記事です。",
    guideText:
      "症状がいつから続いているか、利用端末や場所、回線種別をメモしてから対処しましょう。再起動や設定確認のあとも改善しない場合は、契約キャリアの公式サポート窓口を優先してください。",
    themeColor: "#d97706",
    gradient: "linear-gradient(135deg, #ffedd5 0%, #fdba74 100%)",
    ogImage: "/og/og-trouble.png",
  },
  cost: {
    label: "固定費・ライフイベント",
    href: "/cost",
    description: "通信×固定費のセット見直し・引越し・新生活向け記事一覧",
    heroLead:
      "電気・セット割・引越し時の通信まとめなど、固定費と通信を横断して見直す記事です。",
    guideText:
      "セット割は対象回線・契約名・適用条件が複雑です。電気料金と通信料を別々に比較する前に、公式のセットシミュレーターで前提条件を揃えて確認しましょう。",
    themeColor: "#7c3aed",
    gradient: "linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)",
    ogImage: "/og/og-default.png",
  },
};
