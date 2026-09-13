import { isValidSlug } from "./session.ts";

/**
 * 購入を確定させる Stripe イベント。
 * コンビニ払い・銀行振込などの後払いは `checkout.session.completed` の時点では未入金なので、
 * 入金完了を知らせる `async_payment_succeeded` も受け取る必要がある。
 */
export const GRANTING_EVENT_TYPES = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
] as const;

/** Stripe イベントのうち、判定に必要な部分だけを見る。 */
export interface CheckoutEventLike {
  type: string;
  data: {
    object: {
      payment_status?: string | null;
      metadata?: Record<string, string> | null;
    };
  };
}

export interface Grant {
  slug: string;
  buyerId: string;
}

/**
 * イベントから「誰に・どの記事を解放するか」を取り出す。
 * 解放すべきでないイベント（未入金・対象外の種別・メタデータ不備）は null。
 */
export function resolveGrantFromEvent(event: CheckoutEventLike): Grant | null {
  if (!GRANTING_EVENT_TYPES.includes(event.type as never)) {
    return null;
  }

  const session = event.data.object;
  if (session.payment_status !== "paid") {
    return null;
  }

  const slug = session.metadata?.slug;
  const buyerId = session.metadata?.buyerId;
  if (!isValidSlug(slug) || !buyerId) {
    return null;
  }

  return { slug, buyerId };
}
