#!/usr/bin/env node
/**
 * Publish premium (paid) article bodies to Vercel KV.
 *
 * このリポジトリは public なので、有料本文は git に入れず KV にだけ置く。
 * 価格とタイトルは記事の frontmatter（paywallPrice / title）を正とし、
 * push のたびに KV 側へ同期する。
 *
 * Usage:
 *   KV_REST_API_URL=... KV_REST_API_TOKEN=... \
 *     node scripts/paywall-push.mjs push <slug> [--file drafts/premium/<slug>.md] [--dry-run]
 *   node scripts/paywall-push.mjs list
 *   node scripts/paywall-push.mjs remove <slug>
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { kv } from "@vercel/kv";
import { parseFrontmatter } from "../../scripts/e2e/e2e-utils.mjs";

const siteDir = dirname(fileURLToPath(import.meta.url)) + "/..";
const repoRoot = resolve(siteDir, "..");
const articlesDir = join(siteDir, "src/content/articles");

const BODY_KEY = (slug) => `paywall:body:${slug}`;
const META_KEY = (slug) => `paywall:meta:${slug}`;
const SLUGS_KEY = "paywall:slugs";

function die(message) {
  console.error(message);
  process.exit(1);
}

function requireKv() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    die("KV_REST_API_URL / KV_REST_API_TOKEN が未設定です。");
  }
}

/** 記事 frontmatter から有料記事のメタ情報を取り出す。 */
function readArticleMeta(slug) {
  const articlePath = join(articlesDir, `${slug}.md`);
  if (!existsSync(articlePath)) {
    die(`記事が見つかりません: ${articlePath}`);
  }

  const { fields, error } = parseFrontmatter(readFileSync(articlePath, "utf8"));
  if (error) {
    die(`${slug}: frontmatter を読めません (${error})`);
  }

  const price = Number(fields.paywallPrice);
  if (!Number.isInteger(price) || price < 100 || price > 50000) {
    die(
      `${slug}: frontmatter の paywallPrice が不正です（100〜50000 の整数）: ${fields.paywallPrice}`,
    );
  }
  if (!fields.title) {
    die(`${slug}: frontmatter に title がありません`);
  }
  if (fields.draft === "true") {
    die(`${slug}: draft: true の記事は push できません`);
  }

  return { slug, title: fields.title, price };
}

async function push(slug, options) {
  const meta = {
    ...readArticleMeta(slug),
    updatedAt: new Date().toISOString(),
  };

  const bodyPath = options.file
    ? resolve(process.cwd(), options.file)
    : join(repoRoot, "drafts/premium", `${slug}.md`);

  if (!existsSync(bodyPath)) {
    die(`有料本文が見つかりません: ${bodyPath}`);
  }

  const body = readFileSync(bodyPath, "utf8").trim();
  if (body.length === 0) {
    die(`有料本文が空です: ${bodyPath}`);
  }

  console.log(`slug   : ${meta.slug}`);
  console.log(`title  : ${meta.title}`);
  console.log(`price  : ${meta.price.toLocaleString("ja-JP")}円`);
  console.log(`body   : ${bodyPath} (${body.length} 文字)`);

  if (options.dryRun) {
    console.log("\n--dry-run のため KV には書き込みませんでした。");
    return;
  }

  requireKv();
  await kv.set(BODY_KEY(slug), body);
  await kv.set(META_KEY(slug), meta);
  await kv.sadd(SLUGS_KEY, slug);
  console.log("\nKV へ反映しました。");
}

async function list() {
  requireKv();
  const slugs = (await kv.smembers(SLUGS_KEY)) ?? [];
  if (slugs.length === 0) {
    console.log("有料記事は登録されていません。");
    return;
  }
  for (const slug of slugs.sort()) {
    const meta = await kv.get(META_KEY(slug));
    console.log(
      `${slug}\t${meta?.price ?? "?"}円\t${meta?.updatedAt ?? "?"}\t${meta?.title ?? ""}`,
    );
  }
}

async function remove(slug) {
  requireKv();
  await kv.del(BODY_KEY(slug), META_KEY(slug));
  await kv.srem(SLUGS_KEY, slug);
  console.log(`${slug} を KV から削除しました。`);
}

const [command, ...rest] = process.argv.slice(2);
const positional = rest.filter((arg) => !arg.startsWith("--"));
const options = {
  dryRun: rest.includes("--dry-run"),
  file: rest.find((arg) => arg.startsWith("--file="))?.slice("--file=".length),
};

const fileFlagIndex = rest.indexOf("--file");
if (fileFlagIndex !== -1) {
  options.file = rest[fileFlagIndex + 1];
  positional.splice(positional.indexOf(options.file), 1);
}

switch (command) {
  case "push":
    if (!positional[0]) die("slug を指定してください: push <slug>");
    await push(positional[0], options);
    break;
  case "list":
    await list();
    break;
  case "remove":
    if (!positional[0]) die("slug を指定してください: remove <slug>");
    await remove(positional[0]);
    break;
  default:
    die(
      "使い方: paywall-push.mjs <push|list|remove> [slug] [--file <path>] [--dry-run]",
    );
}
