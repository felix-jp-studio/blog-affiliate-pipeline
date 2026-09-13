import { kv } from "@vercel/kv";
import { normalizeRestoreCode } from "./tokens.ts";
import type { PremiumMeta } from "./types.ts";

const BODY_KEY = (slug: string) => `paywall:body:${slug}`;
const META_KEY = (slug: string) => `paywall:meta:${slug}`;
const SLUGS_KEY = "paywall:slugs";
const GRANTS_KEY = (buyerId: string) => `paywall:grants:${buyerId}`;
const RESTORE_KEY = (code: string) =>
  `paywall:restore:${normalizeRestoreCode(code)}`;
const BUYER_CODE_KEY = (buyerId: string) => `paywall:buyer-code:${buyerId}`;
const EVENT_KEY = (eventId: string) => `paywall:event:${eventId}`;

export function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/* ---- 有料本文（リポジトリには置かず KV のみに保存） ---- */

export async function getPremiumBody(slug: string): Promise<string | null> {
  return (await kv.get<string>(BODY_KEY(slug))) ?? null;
}

export async function getPremiumMeta(
  slug: string,
): Promise<PremiumMeta | null> {
  return (await kv.get<PremiumMeta>(META_KEY(slug))) ?? null;
}

export async function putPremiumArticle(
  meta: PremiumMeta,
  body: string,
): Promise<void> {
  await kv.set(BODY_KEY(meta.slug), body);
  await kv.set(META_KEY(meta.slug), meta);
  await kv.sadd(SLUGS_KEY, meta.slug);
}

export async function removePremiumArticle(slug: string): Promise<void> {
  await kv.del(BODY_KEY(slug), META_KEY(slug));
  await kv.srem(SLUGS_KEY, slug);
}

export async function listPremiumSlugs(): Promise<string[]> {
  return (await kv.smembers<string[]>(SLUGS_KEY)) ?? [];
}

/* ---- 購入記録 ---- */

export async function grantAccess(
  buyerId: string,
  slug: string,
): Promise<void> {
  await kv.sadd(GRANTS_KEY(buyerId), slug);
}

export async function hasAccess(
  buyerId: string,
  slug: string,
): Promise<boolean> {
  return (await kv.sismember(GRANTS_KEY(buyerId), slug)) === 1;
}

export async function listGrants(buyerId: string): Promise<string[]> {
  return (await kv.smembers<string[]>(GRANTS_KEY(buyerId))) ?? [];
}

/* ---- 復元コード（別端末への引き継ぎ） ---- */

/** 購入者ごとに 1 つだけ発行し、以後は同じコードを返す。 */
export async function ensureRestoreCode(
  buyerId: string,
  generate: () => string,
): Promise<string> {
  const existing = await kv.get<string>(BUYER_CODE_KEY(buyerId));
  if (existing) return existing;

  const code = generate();
  await kv.set(BUYER_CODE_KEY(buyerId), code);
  await kv.set(RESTORE_KEY(code), buyerId);
  return code;
}

export async function resolveRestoreCode(code: string): Promise<string | null> {
  return (await kv.get<string>(RESTORE_KEY(code))) ?? null;
}

/* ---- Stripe webhook の冪等性 ---- */

/** 30 日間だけ処理済みイベントを覚えておく。既に処理済みなら false。 */
export async function markEventProcessed(eventId: string): Promise<boolean> {
  const stored = await kv.set(EVENT_KEY(eventId), Date.now(), {
    nx: true,
    ex: 60 * 60 * 24 * 30,
  });
  return stored === "OK";
}
