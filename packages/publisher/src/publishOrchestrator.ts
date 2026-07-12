import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import type { PublisherConfig } from "./config.js";
import { assertNoForbiddenPhrases, injectAffiliateLinks } from "./affiliateInjector.js";
import type { ArticleFrontmatter, PublishState, WpPostStatus } from "./types.js";
import { WpClient } from "./wpClient.js";

function parseStatus(argv: string[], fallback: WpPostStatus): WpPostStatus {
  const idx = argv.indexOf("--status");
  if (idx === -1 || !argv[idx + 1]) return fallback;
  return argv[idx + 1] as WpPostStatus;
}

function readState(path: string): PublishState {
  try {
    return JSON.parse(readFileSync(resolve(path), "utf8")) as PublishState;
  } catch {
    return { articles: [] };
  }
}

function writeState(path: string, state: PublishState): void {
  writeFileSync(resolve(path), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export async function runPing(config: PublisherConfig): Promise<void> {
  const client = new WpClient(config);
  const result = await client.ping();
  if (!result.ok) {
    throw new Error(`WordPress 接続失敗 (HTTP ${result.status})`);
  }
  console.log(`OK: WordPress 接続成功 (${config.WP_URL})`);
}

export async function runPost(config: PublisherConfig, argv: string[]): Promise<void> {
  const fileIdx = argv.indexOf("--file");
  if (fileIdx === -1 || !argv[fileIdx + 1]) {
    throw new Error("--file <path> が必要です");
  }

  const filePath = resolve(argv[fileIdx + 1]);
  const raw = readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as ArticleFrontmatter;

  if (!fm.title) {
    throw new Error("frontmatter に title が必要です");
  }

  assertNoForbiddenPhrases(content, config.AFFILIATE_RULES_PATH);

  const articleType = fm.articleType ?? "howto";
  let html = marked.parse(content) as string;
  html = injectAffiliateLinks(html, articleType, config.AFFILIATE_RULES_PATH);

  const status = parseStatus(argv, fm.status ?? "draft");
  const slug = fm.slug;

  if (config.mode === "dry-run") {
    console.log(`[dry-run] title=${fm.title} status=${status} slug=${slug ?? "(auto)"}`);
    console.log(`[dry-run] html length=${html.length}`);
    return;
  }

  const state = readState(config.PUBLISH_STATE_PATH);
  if (state.articles.length >= config.MAX_POSTS_PER_RUN) {
    throw new Error(`MAX_POSTS_PER_RUN (${config.MAX_POSTS_PER_RUN}) に達しています`);
  }

  const client = new WpClient(config);
  const created = await client.createPost({
    title: fm.title,
    content: html,
    status,
    slug,
  });

  state.articles.push({
    keywordId: fm.keywordId,
    slug: created.slug,
    wpPostId: created.id,
    url: created.link,
    status,
    publishedAt: new Date().toISOString(),
  });
  writeState(config.PUBLISH_STATE_PATH, state);

  console.log(`Posted: #${created.id} ${created.link}`);
}
