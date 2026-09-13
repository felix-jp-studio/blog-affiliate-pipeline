export const prerender = false;

import type { APIRoute } from "astro";
import {
  isPaywallConfigured,
  isPaywallEnabled,
} from "../../../lib/paywall/config.ts";
import {
  getPremiumMeta,
  hasAccess,
  isKvConfigured,
} from "../../../lib/paywall/kv-store.ts";
import {
  buyerCookieHeader,
  createStripeClient,
  isValidSlug,
  jsonResponse,
  resolveBuyerId,
  resolveOrigin,
} from "../../../lib/paywall/session.ts";
import { newBuyerId } from "../../../lib/paywall/tokens.ts";

export const POST: APIRoute = async ({ request, site }) => {
  if (!isPaywallEnabled()) {
    return jsonResponse({ error: "Paywall is disabled." }, 404);
  }
  if (!isPaywallConfigured() || !isKvConfigured()) {
    return jsonResponse({ error: "Paywall is not configured." }, 503);
  }

  let slug: unknown;
  try {
    ({ slug } = await request.json());
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  if (!isValidSlug(slug)) {
    return jsonResponse({ error: "Invalid slug." }, 400);
  }

  const meta = await getPremiumMeta(slug);
  if (!meta) {
    return jsonResponse({ error: "Premium content not found." }, 404);
  }

  // 購入前に採番しておくと、決済ページから戻ってきたときに同じ購入者として扱える。
  const buyerId = resolveBuyerId(request) ?? newBuyerId();
  if (await hasAccess(buyerId, slug)) {
    return jsonResponse({ alreadyPurchased: true }, 200);
  }

  const origin = resolveOrigin(site, request);
  const articleUrl = `${origin}/articles/${slug}`;

  const session = await createStripeClient().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "jpy",
          unit_amount: meta.price,
          product_data: { name: meta.title },
        },
      },
    ],
    success_url: `${articleUrl}?pw_session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${articleUrl}?pw_canceled=1`,
    metadata: { slug, buyerId },
  });

  if (!session.url) {
    return jsonResponse({ error: "Failed to start checkout." }, 502);
  }

  return jsonResponse({ url: session.url }, 200, buyerCookieHeader(buyerId));
};
