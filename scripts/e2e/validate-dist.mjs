import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  articleRequiresAffiliate,
  distDir,
  fail,
  loadPublishedArticles,
  missingAffiliatePatterns,
  pass,
} from "./e2e-utils.mjs";

const errors = [];
const published = loadPublishedArticles().filter(
  (article) => !article.draft && !article.error,
);

if (published.length === 0) {
  fail(["no published articles to validate in dist"]);
}

if (!existsSync(distDir)) {
  fail([`dist directory not found: ${distDir} (run "cd site && npm run build" first)`]);
}

const requiredMeta = [
  /<title>[^<]+<\/title>/,
  /<meta property="og:title"/,
  /<meta property="og:description"/,
  /<meta property="og:image"/,
  /<meta property="og:url"/,
  /"@type"\s*:\s*"Article"/,
];

for (const article of published) {
  const htmlPath = join(distDir, "articles", article.slug, "index.html");
  if (!existsSync(htmlPath)) {
    errors.push(`${article.slug}: missing dist HTML at ${htmlPath}`);
    continue;
  }

  const html = readFileSync(htmlPath, "utf8");
  for (const pattern of requiredMeta) {
    if (!pattern.test(html)) {
      errors.push(`${article.slug}: missing required HTML/meta pattern ${pattern}`);
    }
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonical || !canonical[1].endsWith(`/articles/${article.slug}`)) {
    errors.push(`${article.slug}: canonical URL mismatch`);
  }

  if (articleRequiresAffiliate(article)) {
    const missingPatterns = missingAffiliatePatterns(html);
    if (missingPatterns.length > 0) {
      errors.push(
        `${article.slug}: missing affiliate link patterns in dist HTML: ${missingPatterns.join(", ")}`,
      );
    }
  }
}

const robotsPath = join(distDir, "robots.txt");
if (!existsSync(robotsPath)) {
  errors.push("robots.txt: missing from dist");
} else {
  const robotsText = readFileSync(robotsPath, "utf8");
  if (!robotsText.includes("User-agent: *")) {
    errors.push("robots.txt: missing User-agent: *");
  }
  if (!robotsText.includes("Allow: /")) {
    errors.push("robots.txt: missing Allow: /");
  }
  if (!robotsText.includes("Sitemap: https://sim-hikari-guide.com/sitemap-index.xml")) {
    errors.push("robots.txt: missing Sitemap URL");
  }
}

const sitemapFiles = readdirSync(distDir).filter(
  (name) => name.startsWith("sitemap") && name.endsWith(".xml"),
);
if (sitemapFiles.length === 0) {
  errors.push("no sitemap XML files found in dist");
} else {
  const sitemapText = sitemapFiles
    .map((name) => readFileSync(join(distDir, name), "utf8"))
    .join("\n");
  const articleUrls = [
    ...sitemapText.matchAll(/<loc>[^<]*\/articles\/([^<]+)<\/loc>/g),
  ].map((match) => match[1]);
  const sitemapSlugs = new Set(articleUrls);

  for (const article of published) {
    if (!sitemapSlugs.has(article.slug)) {
      errors.push(`${article.slug}: missing from sitemap`);
    }
  }

  if (sitemapSlugs.size !== published.length) {
    errors.push(
      `sitemap article count mismatch: sitemap=${sitemapSlugs.size}, published=${published.length}`,
    );
  }
}

const indexnowKey = process.env.INDEXNOW_KEY?.trim();
const INDEXNOW_KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;
if (indexnowKey) {
  if (!INDEXNOW_KEY_PATTERN.test(indexnowKey)) {
    errors.push("INDEXNOW_KEY must be 8-128 ASCII letters, digits, or hyphens");
  } else {
    const keyFilePath = join(distDir, `${indexnowKey}.txt`);
    if (!existsSync(keyFilePath)) {
      errors.push(`IndexNow key file missing in dist: ${keyFilePath}`);
    } else {
      const keyBody = readFileSync(keyFilePath, "utf8").trim();
      if (keyBody !== indexnowKey) {
        errors.push("IndexNow key file content does not match INDEXNOW_KEY");
      }
    }
  }
}

if (errors.length > 0) {
  fail(errors);
}

pass("validate-dist", published.length);
