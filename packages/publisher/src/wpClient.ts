import type { PublisherConfig } from "./config.js";
import type { WpPostPayload, WpPostResponse } from "./types.js";

function authHeader(config: PublisherConfig): string {
  const token = Buffer.from(`${config.WP_USER}:${config.WP_APP_PASSWORD}`).toString(
    "base64",
  );
  return `Basic ${token}`;
}

function apiBase(config: PublisherConfig): string {
  return `${config.WP_URL.replace(/\/$/, "")}/wp-json/wp/v2`;
}

export class WpClient {
  constructor(
    private readonly config: PublisherConfig,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async ping(): Promise<{ ok: boolean; status: number }> {
    const res = await this.fetchFn(`${apiBase(this.config)}/posts?per_page=1`, {
      headers: { Authorization: authHeader(this.config) },
    });
    return { ok: res.ok, status: res.status };
  }

  async createPost(payload: WpPostPayload): Promise<WpPostResponse> {
    const res = await this.fetchFn(`${apiBase(this.config)}/posts`, {
      method: "POST",
      headers: {
        Authorization: authHeader(this.config),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`WP post failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as WpPostResponse;
    return data;
  }
}
