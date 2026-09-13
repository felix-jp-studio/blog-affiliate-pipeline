export const prerender = false;

import type { APIRoute } from "astro";
import {
  getStripeWebhookSecret,
  isPaywallConfigured,
} from "../../../lib/paywall/config.ts";
import {
  ensureRestoreCode,
  grantAccess,
  isKvConfigured,
  markEventProcessed,
} from "../../../lib/paywall/kv-store.ts";
import {
  createStripeClient,
  jsonResponse,
} from "../../../lib/paywall/session.ts";
import { newRestoreCode } from "../../../lib/paywall/tokens.ts";
import { resolveGrantFromEvent } from "../../../lib/paywall/webhook.ts";

/**
 * Stripe からの入金通知で購入を確定させる。
 *
 * 決済後に記事へ戻ってこなかった購入者や、コンビニ払い・銀行振込のように
 * 後から入金される決済でも、この経路だけで解放が完了する。
 * 記事側の /api/paywall/unlock とは互いに冪等なので、両方走っても問題ない。
 *
 * PUBLIC_PAYWALL_ENABLED には依存しない（購入導線を止めても入金は届くため）。
 */
export const POST: APIRoute = async ({ request }) => {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret || !isPaywallConfigured() || !isKvConfigured()) {
    return jsonResponse({ error: "Paywall webhook is not configured." }, 503);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return jsonResponse({ error: "Missing stripe-signature header." }, 400);
  }

  // 署名検証には解析前の生ボディが必要
  const payload = await request.text();

  let event;
  try {
    event = await createStripeClient().webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret,
    );
  } catch {
    return jsonResponse({ error: "Signature verification failed." }, 400);
  }

  const grant = resolveGrantFromEvent(event);
  if (!grant) {
    // 対象外のイベントも 200 で返さないと Stripe がリトライし続ける
    return jsonResponse({ received: true, granted: false }, 200);
  }

  if (!(await markEventProcessed(event.id))) {
    return jsonResponse({ received: true, duplicate: true }, 200);
  }

  await grantAccess(grant.buyerId, grant.slug);
  await ensureRestoreCode(grant.buyerId, newRestoreCode);

  return jsonResponse({ received: true, granted: true }, 200);
};
