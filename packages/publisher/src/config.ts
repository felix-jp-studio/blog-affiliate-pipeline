import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}, z.string().optional());

const envSchema = z.object({
  WP_URL: z.string().url(),
  WP_USER: z.string().min(1),
  WP_APP_PASSWORD: z.string().min(1),
  PUBLISH_STATE_PATH: z.string().default("../../state/publish-state.json"),
  MAX_POSTS_PER_RUN: z
    .string()
    .default("1")
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1).max(20)),
  AFFILIATE_RULES_PATH: z.string().default("../../config/affiliate-rules.json"),
});

export type PublisherConfig = z.infer<typeof envSchema> & {
  mode: "dry-run" | "publish";
};

export function loadConfig(argv: string[]): PublisherConfig {
  const parsed = envSchema.parse(process.env);
  const mode = argv.includes("--publish") ? "publish" : "dry-run";
  return { ...parsed, mode };
}

export function requirePublishCredentials(config: PublisherConfig): void {
  if (!config.WP_URL || !config.WP_USER || !config.WP_APP_PASSWORD) {
    throw new Error("WP_URL / WP_USER / WP_APP_PASSWORD が必要です。");
  }
}
