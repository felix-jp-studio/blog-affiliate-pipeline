export interface PremiumMeta {
  slug: string;
  title: string;
  /** 単品買い切り価格（JPY / 税込・整数円） */
  price: number;
  updatedAt: string;
}

export interface Buyer {
  /** cookie に載る購入者識別子（署名付き） */
  id: string;
  /** 端末を移したときに購入を引き継ぐためのコード */
  restoreCode: string;
}
