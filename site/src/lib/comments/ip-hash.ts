import { createHash } from "node:crypto";

export function hashClientIp(
  ip: string | null | undefined,
  salt: string,
): string | undefined {
  if (!ip?.trim()) return undefined;
  return createHash("sha256")
    .update(`${salt}:${ip.trim()}`)
    .digest("hex")
    .slice(0, 16);
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return request.headers.get("x-real-ip");
}
