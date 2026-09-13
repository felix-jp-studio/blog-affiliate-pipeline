/**
 * 特定商取引法に基づく表記。
 *
 * 事業者情報（氏名・住所・電話番号）は個人情報なので、public な本リポジトリには置かず
 * 環境変数から読む。ページに公開される値なので PUBLIC_ 接頭辞を付けている
 * （PUBLIC_ でないと Astro がビルド時に静的ページへ埋め込めない）。
 *
 * ローカル: site/.env
 * 本番:     Vercel の Environment Variables
 */
export interface SellerInfo {
  /** 販売事業者名（個人事業主なら氏名、法人なら法人名） */
  name: string;
  /** 運営統括責任者 */
  representative: string;
  /** 所在地 */
  address: string;
  /** 電話番号 */
  phone: string;
  /** 連絡先メールアドレス */
  email: string;
}

export const seller: SellerInfo = {
  name: import.meta.env.PUBLIC_TOKUSHOHO_NAME ?? "",
  representative: import.meta.env.PUBLIC_TOKUSHOHO_REPRESENTATIVE ?? "",
  address: import.meta.env.PUBLIC_TOKUSHOHO_ADDRESS ?? "",
  phone: import.meta.env.PUBLIC_TOKUSHOHO_PHONE ?? "",
  email: import.meta.env.PUBLIC_TOKUSHOHO_EMAIL ?? "",
};

export function isSellerInfoComplete(info: SellerInfo = seller): boolean {
  return Object.values(info).every((value) => value.trim() !== "");
}

/** 事業者情報が未設定のときにページへ出す文字列。本番 smoke テストが検出する。 */
export const SELLER_UNSET_MARKER = "（未設定）";

export interface TokushohoRow {
  term: string;
  body: string;
}

/** 実装から確定する項目（決済は Stripe、引渡しは決済完了時の即時閲覧）。 */
export const tokushohoRows: TokushohoRow[] = [
  {
    term: "販売価格",
    body: "各有料記事のページに表示する金額（消費税込）。",
  },
  {
    term: "商品代金以外の必要料金",
    body: "ありません。インターネット接続に必要な通信料は購入者のご負担となります。",
  },
  {
    term: "支払方法",
    body: "クレジットカード決済（Stripe）。ご利用可能なブランドは決済画面に表示されます。",
  },
  {
    term: "支払時期",
    body: "購入手続きの完了時にお支払いが確定します。コンビニ払い・銀行振込をご利用の場合は、指定期限までにお支払いください。",
  },
  {
    term: "商品の引渡時期",
    body: "決済完了後、ただちに当該記事の有料部分を閲覧いただけます。コンビニ払い・銀行振込の場合は、入金が確認された時点で閲覧可能になります。",
  },
  {
    term: "商品の内容",
    body: "当サイトが提供する記事の有料部分の閲覧権（記事ごとの買い切り）。購入後の追加費用や期間の制限はありません。",
  },
  {
    term: "返品・キャンセルについて",
    body: "デジタルコンテンツの性質上、購入後のお客様都合による返品・返金はお受けできません。ただし、記事が表示されない等の不具合がある場合、または内容が表示と著しく異なる場合は、お問い合わせ窓口までご連絡ください。個別に対応いたします。",
  },
  {
    term: "動作環境",
    body: "一般的なウェブブラウザ（最新版の Chrome / Safari / Edge / Firefox）。Cookie を有効にしてご利用ください。購入状態の保持に Cookie を使用します。",
  },
];
