import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { compareArticlesByRecency } from "../utils/sort-articles";

const FEED_LIMIT = 20;
const SITE_TITLE = "SIM・光回線ガイド";
const SITE_DESCRIPTION = "格安SIM・光回線の比較・乗り換え・お困り解決ガイド";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(date: Date): string {
  return date.toUTCString();
}

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.href ?? "https://sim-hikari-guide.com";
  const articles = (await getCollection("articles", ({ data }) => !data.draft))
    .sort(compareArticlesByRecency)
    .slice(0, FEED_LIMIT);

  const items = articles
    .map((article) => {
      const link = new URL(`/articles/${article.id}`, siteUrl).href;
      const description = article.data.excerpt ?? article.data.description;
      return `    <item>
      <title>${escapeXml(article.data.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${toRfc822(article.data.pubDate)}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  const lastBuildDate =
    articles.length > 0
      ? toRfc822(articles[0].data.pubDate)
      : toRfc822(new Date());

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ja</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
};
