import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(scriptDir, "../..");
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

export const VALID_CATEGORIES = new Set(["sim", "hikari", "trouble"]);
export const VALID_ARTICLE_TYPES = new Set(["comparison", "howto", "troubleshoot"]);
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
