import { readFileSync } from "node:fs";
import {
  FORBIDDEN_SLUG_PATTERN,
  REQUIRED_FIELDS,
  SLUG_PATTERN,
  VALID_ARTICLE_TYPES,
  VALID_CATEGORIES,
  articleRequiresAffiliate,
  fail,
  listArticleFiles,
  missingAffiliatePatterns,
  parseFrontmatter,
  pass,
} from "./e2e-utils.mjs";

const errors = [];

if (listArticleFiles().length === 0) {
  fail(["no article markdown files found"]);
}

for (const filePath of listArticleFiles()) {
  const slug = filePath.split("/").pop().replace(/\.md$/, "");
  const content = readFileSync(filePath, "utf8");
  const parsed = parseFrontmatter(content);

  if (parsed.error) {
    errors.push(`${slug}: ${parsed.error}`);
    continue;
  }

  if (!SLUG_PATTERN.test(slug)) {
    errors.push(`${slug}: invalid slug format`);
  }
  if (FORBIDDEN_SLUG_PATTERN.test(slug)) {
    errors.push(`${slug}: forbidden SEO fallback slug (article-pN)`);
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in parsed.fields) || parsed.fields[field] === "") {
      errors.push(`${slug}: missing required field "${field}"`);
    }
  }

  const { fields } = parsed;
  if (fields.category && !VALID_CATEGORIES.has(fields.category)) {
    errors.push(`${slug}: invalid category "${fields.category}"`);
  }
  if (fields.articleType && !VALID_ARTICLE_TYPES.has(fields.articleType)) {
    errors.push(`${slug}: invalid articleType "${fields.articleType}"`);
  }
  if (fields.draft !== "true" && fields.draft !== "false") {
    errors.push(`${slug}: draft must be true or false`);
  }
  if (!fields.pubDate || Number.isNaN(Date.parse(fields.pubDate))) {
    errors.push(`${slug}: invalid pubDate "${fields.pubDate ?? ""}"`);
  }

  const article = { slug, fields, draft: fields.draft === "true" };
  if (!article.draft && articleRequiresAffiliate(article)) {
    const missingPatterns = missingAffiliatePatterns(content, undefined, {
      allowPlaceholders: true,
    });
    if (missingPatterns.length > 0) {
      errors.push(
        `${slug}: missing affiliate link patterns: ${missingPatterns.join(", ")}`,
      );
    }
  }
}

if (errors.length > 0) {
  fail(errors);
}

pass("validate-articles", listArticleFiles().length);
