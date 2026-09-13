export const prerender = false;

import type { APIRoute } from "astro";
import {
  isPaywallConfigured,
  isPaywallEnabled,
} from "../../../lib/paywall/config.ts";
import {
  isKvConfigured,
  listGrants,
  resolveRestoreCode,
} from "../../../lib/paywall/kv-store.ts";
import {
  buyerCookieHeader,
  jsonResponse,
} from "../../../lib/paywall/session.ts";
import { normalizeRestoreCode } from "../../../lib/paywall/tokens.ts";

/** 別端末・cookie 削除後に、復元コードで購入を引き継ぐ。 */
export const POST: APIRoute = async ({ request }) => {
  if (!isPaywallEnabled()) {
    return jsonResponse({ error: "Paywall is disabled." }, 404);
  }
  if (!isPaywallConfigured() || !isKvConfigured()) {
    return jsonResponse({ error: "Paywall is not configured." }, 503);
  }

  let code: unknown;
  try {
    ({ code } = await request.json());
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  if (typeof code !== "string" || code.length > 64) {
    return jsonResponse({ error: "Invalid restore code." }, 400);
  }

  const normalized = normalizeRestoreCode(code);
  if (normalized.length !== 12) {
    return jsonResponse({ error: "Invalid restore code." }, 400);
  }

  const buyerId = await resolveRestoreCode(normalized);
  if (!buyerId) {
    return jsonResponse({ error: "Restore code was not found." }, 404);
  }

  return jsonResponse(
    { slugs: await listGrants(buyerId) },
    200,
    buyerCookieHeader(buyerId),
  );
};
