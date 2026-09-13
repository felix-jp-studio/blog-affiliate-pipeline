import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** 復元コードに使う文字集合。0/O・1/I など読み間違えやすい文字は除外。 */
const RESTORE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function newBuyerId(): string {
  return randomBytes(16).toString("base64url");
}

/** 手入力してもらう前提で 4 文字 x 3 ブロック。 */
export function newRestoreCode(): string {
  const bytes = randomBytes(12);
  const chars = Array.from(
    bytes,
    (byte) => RESTORE_ALPHABET[byte % RESTORE_ALPHABET.length],
  );
  return [
    chars.slice(0, 4).join(""),
    chars.slice(4, 8).join(""),
    chars.slice(8, 12).join(""),
  ].join("-");
}

export function normalizeRestoreCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function createBuyerToken(buyerId: string, secret: string): string {
  return `${buyerId}.${sign(buyerId, secret)}`;
}

/** 署名が一致すれば buyerId を返す。改竄・形式不正は null。 */
export function readBuyerToken(
  token: string | undefined | null,
  secret: string,
): string | null {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const buyerId = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!/^[A-Za-z0-9_-]+$/.test(buyerId) || !signature) return null;

  const expected = Buffer.from(sign(buyerId, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return null;

  return timingSafeEqual(expected, actual) ? buyerId : null;
}

export function buildBuyerCookie(
  token: string,
  maxAgeSeconds: number,
  name: string,
): string {
  return [
    `${name}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}

export function readCookie(
  cookieHeader: string | null,
  name: string,
): string | null {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return null;
}
