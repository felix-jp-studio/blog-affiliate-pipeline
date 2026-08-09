/**
 * Google Search Console API credentials → access token.
 *
 * Supports:
 *   GSC_SERVICE_ACCOUNT_JSON  — preferred for CI
 *   GSC_OAUTH_CLIENT_ID / GSC_OAUTH_CLIENT_SECRET / GSC_OAUTH_REFRESH_TOKEN
 */
import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters";

export function hasServiceAccount() {
  return Boolean(process.env.GSC_SERVICE_ACCOUNT_JSON?.trim());
}

export function hasOAuth() {
  return Boolean(
    process.env.GSC_OAUTH_CLIENT_ID?.trim() &&
      process.env.GSC_OAUTH_CLIENT_SECRET?.trim() &&
      process.env.GSC_OAUTH_REFRESH_TOKEN?.trim(),
  );
}

export function hasApiCredentials() {
  return hasServiceAccount() || hasOAuth();
}

export function siteUrlFromEnv() {
  const raw = process.env.GSC_SITE_URL?.trim() || "https://sim-hikari-guide.com/";
  if (raw.startsWith("sc-domain:")) {
    return raw;
  }
  return raw.endsWith("/") ? raw : `${raw}/`;
}

/** Alternate GSC property identifiers to try when the primary siteUrl returns 403. */
export function siteUrlCandidates() {
  const primary = siteUrlFromEnv();
  const candidates = [primary];

  if (primary.startsWith("sc-domain:")) {
    const domain = primary.slice("sc-domain:".length);
    candidates.push(`https://${domain}/`);
  } else {
    try {
      const hostname = new URL(primary).hostname;
      candidates.push(`sc-domain:${hostname}`);
    } catch {
      // ignore invalid URL
    }
  }

  return [...new Set(candidates)];
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

async function exchangeJwtForToken(assertion) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `GSC token exchange failed (${response.status}): ${body.error_description ?? body.error ?? "unknown"}`,
    );
  }
  if (!body.access_token) {
    throw new Error("GSC token exchange: access_token missing in response");
  }
  return body.access_token;
}

function buildServiceAccountJwt(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: WEBMASTERS_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = sign.sign(serviceAccount.private_key, "base64url");
  return `${unsigned}.${signature}`;
}

async function tokenFromServiceAccount() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON?.trim();
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON missing client_email or private_key");
  }
  const jwt = buildServiceAccountJwt(serviceAccount);
  return exchangeJwtForToken(jwt);
}

async function tokenFromOAuth() {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GSC_OAUTH_CLIENT_ID.trim(),
      client_secret: process.env.GSC_OAUTH_CLIENT_SECRET.trim(),
      refresh_token: process.env.GSC_OAUTH_REFRESH_TOKEN.trim(),
      grant_type: "refresh_token",
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `GSC OAuth refresh failed (${response.status}): ${body.error_description ?? body.error ?? "unknown"}`,
    );
  }
  if (!body.access_token) {
    throw new Error("GSC OAuth refresh: access_token missing in response");
  }
  return body.access_token;
}

/** @returns {Promise<string>} */
export async function getAccessToken() {
  if (hasServiceAccount()) {
    return tokenFromServiceAccount();
  }
  if (hasOAuth()) {
    return tokenFromOAuth();
  }
  throw new Error(
    "GSC API credentials missing. Set GSC_SERVICE_ACCOUNT_JSON or GSC_OAUTH_* secrets.",
  );
}
