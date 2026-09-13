export const prerender = false;

import type { APIRoute } from "astro";
import {
  isPaywallConfigured,
  isPaywallEnabled,
} from "../../../lib/paywall/config.ts";
import {
  ensureRestoreCode,
  getPremiumBody,
  hasAccess,
  isKvConfigured,
} from "../../../lib/paywall/kv-store.ts";
import { renderPremiumMarkdown } from "../../../lib/paywall/render.ts";
import {
  isValidSlug,
  jsonResponse,
  resolveBuyerId,
} from "../../../lib/paywall/session.ts";
import { newRestoreCode } from "../../../lib/paywall/tokens.ts";

/** 購入済み cookie を持つ再訪者に有料本文を返す。 */
export const GET: APIRoute = async ({ request, url }) => {
  if (!isPaywallEnabled()) {
    return jsonResponse({ error: "Paywall is disabled." }, 404);
  }
  if (!isPaywallConfigured() || !isKvConfigured()) {
    return jsonResponse({ error: "Paywall is not configured." }, 503);
  }

  const slug = url.searchParams.get("slug");
  if (!isValidSlug(slug)) {
    return jsonResponse({ error: "Invalid slug." }, 400);
  }

  const buyerId = resolveBuyerId(request);
  if (!buyerId || !(await hasAccess(buyerId, slug))) {
    return jsonResponse({ locked: true }, 403);
  }

  const body = await getPremiumBody(slug);
  if (body === null) {
    return jsonResponse({ error: "Premium content not found." }, 404);
  }

  // webhook 経由で解放された購入者はまだ復元コードを見ていないので、ここでも返す
  return jsonResponse(
    {
      html: await renderPremiumMarkdown(body),
      restoreCode: await ensureRestoreCode(buyerId, newRestoreCode),
    },
    200,
  );
};
