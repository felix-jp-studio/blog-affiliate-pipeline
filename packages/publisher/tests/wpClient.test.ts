import { describe, expect, it, vi } from "vitest";
import { WpClient } from "../src/wpClient.js";
import type { PublisherConfig } from "../src/config.js";

const config: PublisherConfig = {
  WP_URL: "https://example.jp",
  WP_USER: "admin",
  WP_APP_PASSWORD: "secret",
  PUBLISH_STATE_PATH: "../../state/publish-state.json",
  MAX_POSTS_PER_RUN: 1,
  AFFILIATE_RULES_PATH: "../../config/affiliate-rules.json",
  mode: "publish",
};

describe("WpClient", () => {
  it("ping returns ok when API responds 200", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const client = new WpClient(config, fetchFn as typeof fetch);
    const result = await client.ping();
    expect(result.ok).toBe(true);
    expect(fetchFn).toHaveBeenCalledWith(
      "https://example.jp/wp-json/wp/v2/posts?per_page=1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Basic"),
        }),
      }),
    );
  });

  it("createPost throws on failure", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 401, text: async () => "unauthorized" });
    const client = new WpClient(config, fetchFn as typeof fetch);
    await expect(
      client.createPost({ title: "t", content: "c", status: "draft" }),
    ).rejects.toThrow("WP post failed (401)");
  });
});
