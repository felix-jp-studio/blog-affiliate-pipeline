import { execFileSync } from "node:child_process";
import { findHardcodedAspUrls, readAspUrls } from "../affiliate/lib.mjs";
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
  pass,
  readArticleMarkdown,
  repoRoot,
} from "./e2e-utils.mjs";

const MIN_DESCRIPTION_LENGTH = 50;
const INTERNAL_LINKS_MARKERS = [
  "<!-- internal-links:v5 -->",
  "<!-- internal-links:v4 -->",
  "<!-- internal-links:v2 -->",
];

const errors = [];
const warnings = [];
const aspRegistry = readAspUrls();

if (listArticleFiles().length === 0) {
  fail(["no article markdown files found"]);
}

for (const filePath of listArticleFiles()) {
  const { slug, content, parsed } = readArticleMarkdown(filePath);

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
  if (fields.dateModified && Number.isNaN(Date.parse(fields.dateModified))) {
    errors.push(`${slug}: invalid dateModified "${fields.dateModified}"`);
  }
  if (fields.paywallPrice !== undefined) {
    const price = Number(fields.paywallPrice);
    if (!Number.isInteger(price) || price < 100 || price > 50000) {
      errors.push(
        `${slug}: paywallPrice must be an integer between 100 and 50000 (got "${fields.paywallPrice}")`,
      );
    }
  }
  if (fields.paywallTeaser && fields.paywallTeaser.length > 200) {
    errors.push(`${slug}: paywallTeaser too long (${fields.paywallTeaser.length} > 200)`);
  }
  if (fields.description && fields.description.length < MIN_DESCRIPTION_LENGTH) {
    errors.push(
      `${slug}: description too short (${fields.description.length} < ${MIN_DESCRIPTION_LENGTH})`,
    );
  }

  const article = { slug, fields, draft: fields.draft === "true" };
  if (
    !article.draft &&
    !INTERNAL_LINKS_MARKERS.some((marker) => content.includes(marker))
  ) {
    errors.push(`${slug}: missing internal-links marker (v5, v4, or v2)`);
  }
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

  const hardcodedAspUrls = findHardcodedAspUrls(content, aspRegistry);
  if (hardcodedAspUrls.length > 0) {
    warnings.push(
      `${slug}: hardcoded ASP URL(s) at line(s) ${hardcodedAspUrls.map((item) => item.line).join(", ")} — use {AFFILIATE:program-id}`,
    );
  }
}

// 有料記事がある場合、特定商取引法に基づく表記の事業者情報が必要。
// 値は PUBLIC_TOKUSHOHO_* 環境変数（public リポジトリに個人情報を置かないため）なので、
// ここでは検証できない。実際の担保は本番 smoke テスト（smoke-production.mjs）が行う。
const paywalledSlugs = [];
for (const filePath of listArticleFiles()) {
  const { slug, parsed } = readArticleMarkdown(filePath);
  if (!parsed.error && parsed.fields.paywallPrice !== undefined) {
    paywalledSlugs.push(slug);
  }
}

if (paywalledSlugs.length > 0) {
  warnings.push(
    `paywalled articles (${paywalledSlugs.join(", ")}): PUBLIC_TOKUSHOHO_* が Vercel に設定済みか確認すること` +
      " — 未設定のまま公開すると /tokushoho が未記入になり、post-deploy smoke が失敗する",
  );
}

// 有料本文は public リポジトリに入れてはいけない（KV にだけ置く）。
try {
  const tracked = execFileSync("git", ["ls-files", "--", "drafts/premium"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
  if (tracked) {
    errors.push(
      `premium bodies must never be committed (this repo is public): ${tracked.split("\n").join(", ")}`,
    );
  }
} catch {
  // git が使えない環境ではスキップする
}

if (warnings.length > 0) {
  console.warn("E2E validation warnings:");
  for (const warning of warnings) {
    console.warn(`  - ${warning}`);
  }
}

if (errors.length > 0) {
  fail(errors);
}

pass("validate-articles", listArticleFiles().length);
