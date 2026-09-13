import Stripe from "stripe";
import {
  BUYER_COOKIE,
  BUYER_COOKIE_MAX_AGE,
  getStripeSecretKey,
  getTokenSecret,
} from "./config.ts";
import {
  buildBuyerCookie,
  createBuyerToken,
  readBuyerToken,
  readCookie,
} from "./tokens.ts";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: unknown): slug is string {
  return (
    typeof slug === "string" && slug.length <= 120 && SLUG_PATTERN.test(slug)
  );
}

export function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

/** cookie の署名を検証して購入者 ID を取り出す。未購入・改竄時は null。 */
export function resolveBuyerId(request: Request): string | null {
  const secret = getTokenSecret();
  if (!secret) return null;

  const token = readCookie(request.headers.get("cookie"), BUYER_COOKIE);
  return readBuyerToken(token, secret);
}

export function buyerCookieHeader(buyerId: string): Record<string, string> {
  const secret = getTokenSecret();
  if (!secret) return {};

  return {
    "Set-Cookie": buildBuyerCookie(
      createBuyerToken(buyerId, secret),
      BUYER_COOKIE_MAX_AGE,
      BUYER_COOKIE,
    ),
  };
}

export function createStripeClient(): Stripe {
  const key = getStripeSecretKey();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

/**
 * Checkout の戻り先 URL に使うオリジン。
 *
 * 通常は astro.config の `site`（本番ドメイン）を使う。
 * dev サーバーではそれを使うと決済後に本番へ飛ばされてしまうので、
 * リクエスト元（localhost）に戻す。
 */
export function resolveOrigin(
  site: URL | undefined,
  request: Request,
  isDev: boolean = import.meta.env?.DEV === true,
): string {
  const requestOrigin = new URL(request.url).origin;
  if (isDev) return requestOrigin;
  return site?.origin ?? requestOrigin;
}
