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
    heroLead:
      "乗り換え・MNP・料金比較から、学生・シニア・法人向けプランまで、格安SIMの選び方をカテゴリ別に整理しています。主要キャリアとMVNOの違いも比較表で確認できます。",
    guideText:
      "月間データ量・通話の使い方・セット割の条件を先に整理しましょう。料金だけでなくエリアと速度の安定性も各キャリアの公式情報で確認し、キャンペーンは適用条件と解約時の注意点まで必ず照合してください。乗り換え前はMNP予約番号の取得可否も確認しておくと安心です。",
    themeColor: "#0b6bcb",
    gradient: "var(--gradient-sim)",
    ogImage: "/og/og-sim.png",
  },
  hikari: {
    label: "光回線",
    href: "/hikari",
    description: "光回線の比較・乗り換え・セット割",
    heroLead:
      "NURO光・auひかり・ドコモ光など主要回線の料金比較、戸建て・マンション別の選び方、乗り換えキャンペーンまで光回線カテゴリの記事を一覧しています。",
    guideText:
      "提供エリア・工事の有無・解約金・セット割の対象回線を先に確認しましょう。月額だけでなく初期費用とキャッシュバック条件も含めて、各プロバイダの公式サイトで最新情報を比較してください。引越し時期が決まっている場合は、開通までの日数もあわせて確認しておくとスムーズです。",
    themeColor: "#059669",
    gradient: "var(--gradient-hikari)",
    ogImage: "/og/og-hikari.png",
  },
  trouble: {
    label: "お困り系",
    href: "/trouble",
    description: "速度・開通などお困りごとの対処記事一覧",
    heroLead:
      "通信速度の低下、光回線の開通遅延、障害時の確認手順など、日常で起きやすいトラブルへの対処法をステップ形式でまとめています。",
    guideText:
      "症状がいつから続いているか、利用端末や場所、回線種別（SIM / 光 / Wi-Fi）をメモしてから対処しましょう。再起動や設定確認のあとも改善しない場合は、契約キャリアの公式サポート窓口を優先してください。夜間だけ遅い・特定アプリだけ遅いなど、再現条件がある場合はその情報も控えておくと切り分けが早くなります。",
    themeColor: "#d97706",
    gradient: "var(--gradient-trouble)",
    ogImage: "/og/og-trouble.png",
  },
  cost: {
    label: "固定費・ライフイベント",
    href: "/cost",
    description: "通信×固定費のセット見直し・引越し・新生活向け記事一覧",
    heroLead:
      "auでんき・楽天でんきなど電気×通信セット、家族回線のまとめ割、引越し時の光回線手続きなど、固定費と通信を横断して見直す記事を掲載しています。",
    guideText:
      "セット割は対象回線・契約名・適用条件が複雑です。電気料金と通信料を別々に比較する前に、各社公式のセットシミュレーターで前提条件（使用量・契約容量）を揃えて確認しましょう。名義や支払い方法が異なる場合は適用できないケースもあるため、申込前に要件を再確認してください。",
    themeColor: "#7c3aed",
    gradient: "var(--gradient-cost)",
    ogImage: "/og/og-default.png",
  },
};
