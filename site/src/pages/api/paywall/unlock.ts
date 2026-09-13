export const prerender = false;

import type { APIRoute } from "astro";
import {
  isPaywallConfigured,
  isPaywallEnabled,
} from "../../../lib/paywall/config.ts";
import {
  ensureRestoreCode,
  getPremiumBody,
  grantAccess,
  isKvConfigured,
} from "../../../lib/paywall/kv-store.ts";
import { renderPremiumMarkdown } from "../../../lib/paywall/render.ts";
import {
  buyerCookieHeader,
  createStripeClient,
  isValidSlug,
  jsonResponse,
} from "../../../lib/paywall/session.ts";
import { newRestoreCode } from "../../../lib/paywall/tokens.ts";

/**
 * Stripe Checkout から戻ってきた直後に呼ばれる。
 * session_id は購入者しか知り得ないので、これを購入証明として扱い、
 * 以後は cookie の購入者 ID で解放する。
 */
export const GET: APIRoute = async ({ request, url }) => {
  if (!isPaywallEnabled()) {
    return jsonResponse({ error: "Paywall is disabled." }, 404);
  }
  if (!isPaywallConfigured() || !isKvConfigured()) {
    return jsonResponse({ error: "Paywall is not configured." }, 503);
  }

  const slug = url.searchParams.get("slug");
  const sessionId = url.searchParams.get("session_id");

  if (!isValidSlug(slug) || !sessionId) {
    return jsonResponse({ error: "Invalid request." }, 400);
  }

  let session;
  try {
    session = await createStripeClient().checkout.sessions.retrieve(sessionId);
  } catch {
    return jsonResponse({ error: "Checkout session not found." }, 404);
  }

  if (session.payment_status !== "paid") {
    // コンビニ払い・銀行振込は決済完了後も入金待ち。入金時に webhook が解放する。
    if (session.status === "complete") {
      return jsonResponse({ pending: true }, 202);
    }
    return jsonResponse({ error: "Payment is not completed." }, 402);
  }
  if (session.metadata?.slug !== slug) {
    return jsonResponse({ error: "Checkout session does not match." }, 403);
  }

  const buyerId = session.metadata?.buyerId;
  if (!buyerId) {
    return jsonResponse({ error: "Checkout session is missing a buyer." }, 500);
  }

  await grantAccess(buyerId, slug);
  const restoreCode = await ensureRestoreCode(buyerId, newRestoreCode);

  const body = await getPremiumBody(slug);
  if (body === null) {
    return jsonResponse({ error: "Premium content not found." }, 404);
  }

  return jsonResponse(
    { html: await renderPremiumMarkdown(body), restoreCode },
    200,
    buyerCookieHeader(buyerId),
  );
};
