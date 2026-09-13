/** 購入者 cookie 名。値は `${buyerId}.${HMAC}` 形式（tokens.ts 参照）。 */
export const BUYER_COOKIE = "pw_buyer";

/** 買い切りなので cookie は長め（2年）に持たせる。 */
export const BUYER_COOKIE_MAX_AGE = 60 * 60 * 24 * 730;

export const CURRENCY = "jpy";

/** UI に購入導線を出すか。false の間は有料記事も無料パートだけが表示される。 */
export function isPaywallEnabled(): boolean {
  return import.meta.env.PUBLIC_PAYWALL_ENABLED === "true";
}

export function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function getTokenSecret(): string | null {
  return process.env.PAYWALL_TOKEN_SECRET?.trim() || null;
}

/** Stripe webhook の署名検証用。未設定なら webhook エンドポイントは無効。 */
export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

/** 決済・解放に必要な秘密情報が揃っているか。 */
export function isPaywallConfigured(): boolean {
  return Boolean(getStripeSecretKey() && getTokenSecret());
}
