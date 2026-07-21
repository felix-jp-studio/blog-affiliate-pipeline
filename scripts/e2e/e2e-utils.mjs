import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(scriptDir, "../..");
export const e2eConfigPath = join(repoRoot, "config/e2e-smoke.json");
export const articlesPathPrefix = "site/src/content/articles/";
export const articlesDir =
  process.env.E2E_ARTICLES_DIR ?? join(repoRoot, "site/src/content/articles");
export const distDir = join(repoRoot, "site/dist");

export const REQUIRED_FIELDS = [
  "title",
  "description",
  "pubDate",
  "category",
  "articleType",
  "keyword",
  "draft",
];

export const VALID_CATEGORIES = new Set(["sim", "hikari", "trouble", "cost"]);
export const VALID_ARTICLE_TYPES = new Set([
  "comparison",
  "howto",
  "troubleshoot",
  "crosssell",
]);
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const FORBIDDEN_SLUG_PATTERN = /^article-p\d+$/;

export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    return { error: "frontmatter block missing" };
  }

  const fields = {};
  for (const line of match[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }

  return { fields, body: content.slice(match[0].length) };
}

export function listArticleFiles() {
  if (!existsSync(articlesDir)) {
    return [];
  }
  return readdirSync(articlesDir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => join(articlesDir, name));
}

export function loadPublishedArticles() {
  const articles = [];
  for (const filePath of listArticleFiles()) {
    const slug = filePath.split("/").pop().replace(/\.md$/, "");
    const content = readFileSync(filePath, "utf8");
    const parsed = parseFrontmatter(content);
    if (parsed.error) {
      articles.push({ slug, filePath, error: parsed.error });
      continue;
    }
    const draft = parsed.fields.draft === "true";
    articles.push({ slug, filePath, fields: parsed.fields, draft });
  }
  return articles;
}

export function fail(errors) {
  console.error("E2E validation failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

export function pass(label, count) {
  console.log(`[OK] ${label}: ${count} checked`);
}

let cachedE2eConfig;
let cachedAspUrls;

const DEFAULT_AFFILIATE_PATTERNS = ["px\\.a8\\.net", "valuecommerce\\.com"];
const AFFILIATE_PLACEHOLDER_PATTERN = /\{\{?AFFILIATE:[a-z0-9-]+\}\}?/;

export function loadAspUrls() {
  if (cachedAspUrls) {
    return cachedAspUrls;
  }
  const aspUrlsPath = join(repoRoot, "config/asp-urls.json");
  if (!existsSync(aspUrlsPath)) {
    cachedAspUrls = { providers: {} };
    return cachedAspUrls;
  }
  cachedAspUrls = JSON.parse(readFileSync(aspUrlsPath, "utf8"));
  return cachedAspUrls;
}

function patternsFromAspUrls(aspUrls) {
  return Object.values(aspUrls.providers ?? {})
    .filter((provider) => provider.status === "active" && provider.tracking?.hostPattern)
    .map((provider) => provider.tracking.hostPattern.replace(/\./g, "\\."));
}

export function loadE2eConfig() {
  if (cachedE2eConfig) {
    return cachedE2eConfig;
  }
  if (!existsSync(e2eConfigPath)) {
    cachedE2eConfig = {};
    return cachedE2eConfig;
  }
  cachedE2eConfig = JSON.parse(readFileSync(e2eConfigPath, "utf8"));
  return cachedE2eConfig;
}

export function affiliatePatternsFromConfig(config = loadE2eConfig()) {
  if (config.affiliatePatterns?.length) {
    return config.affiliatePatterns.map((pattern) => new RegExp(pattern, "i"));
  }

  const aspPatterns = patternsFromAspUrls(loadAspUrls());
  const patterns = aspPatterns.length > 0 ? aspPatterns : DEFAULT_AFFILIATE_PATTERNS;
  return patterns.map((pattern) => new RegExp(pattern, "i"));
}

export function articleRequiresAffiliate(article, config = loadE2eConfig()) {
  const exemptSlugs = new Set(config.affiliateExemptSlugs ?? []);
  if (exemptSlugs.has(article.slug)) {
    return false;
  }

  const requiredSlugs = new Set(config.articlesRequiringAffiliate ?? []);
  if (requiredSlugs.has(article.slug)) {
    return true;
  }

  const category = article.fields?.category;
  const articleType = article.fields?.articleType;
  return (
    ((category === "sim" || category === "hikari") && articleType === "comparison") ||
    (category === "cost" && articleType === "crosssell")
  );
}

export function missingAffiliatePatterns(
  content,
  config = loadE2eConfig(),
  { allowPlaceholders = false } = {},
) {
  const patterns = affiliatePatternsFromConfig(config);
  const hasAffiliateUrl = patterns.some((pattern) => pattern.test(content));
  const hasPlaceholder =
    allowPlaceholders && AFFILIATE_PLACEHOLDER_PATTERN.test(content);
  if (hasAffiliateUrl || hasPlaceholder) {
    return [];
  }
  return patterns.map((pattern) => pattern.source);
}

export function slugFromArticlePath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const name = normalized.split("/").pop() ?? "";
  return name.replace(/\.md$/, "");
}

export function isArticleMarkdownPath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return (
    normalized.startsWith(articlesPathPrefix) &&
    normalized.endsWith(".md") &&
    !normalized.endsWith("/README.md")
  );
}
