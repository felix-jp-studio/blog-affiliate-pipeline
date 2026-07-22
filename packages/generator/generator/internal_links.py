"""Inject in-body internal links to same-category published articles."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path

SECTION_HEADING = "## あわせて読みたい"
MARKER = "<!-- internal-links:v1 -->"
FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---", re.DOTALL)
DEFAULT_ARTICLES_DIR = "site/src/content/articles"
LINK_COUNT = 2


@dataclass(frozen=True)
class ArticleRef:
    slug: str
    title: str
    category: str
    pub_date: date


def _parse_field(pattern: str, frontmatter: str) -> str | None:
    match = re.search(pattern, frontmatter, re.MULTILINE)
    return match.group(1) if match else None


def load_published_articles(articles_dir: Path) -> list[ArticleRef]:
    if not articles_dir.is_dir():
        return []

    articles: list[ArticleRef] = []
    for path in sorted(articles_dir.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        match = FRONTMATTER_RE.match(text)
        if not match:
            continue

        frontmatter = match.group(1)
        if _parse_field(r"^draft:\s*(true|false)\s*$", frontmatter) == "true":
            continue

        category = _parse_field(r"^category:\s*(\w+)\s*$", frontmatter)
        title = _parse_field(r'^title:\s*"(.*)"\s*$', frontmatter)
        pub_raw = _parse_field(r"^pubDate:\s*(\S+)\s*$", frontmatter)
        if not category or not title or not pub_raw:
            continue

        try:
            pub_date = date.fromisoformat(pub_raw)
        except ValueError:
            continue

        articles.append(
            ArticleRef(
                slug=path.stem,
                title=title,
                category=category,
                pub_date=pub_date,
            )
        )

    return articles


def pick_internal_links(
    *,
    category: str,
    exclude_slug: str,
    articles: list[ArticleRef],
    count: int = LINK_COUNT,
) -> list[ArticleRef]:
    candidates = [
        article
        for article in articles
        if article.category == category and article.slug != exclude_slug
    ]
    candidates.sort(key=lambda article: (article.pub_date, article.slug), reverse=True)
    return candidates[:count]


def build_internal_links_section(links: list[ArticleRef]) -> str:
    if not links:
        return ""

    lines = [
        MARKER,
        SECTION_HEADING,
        "",
        "同じカテゴリの関連記事もあわせてご確認ください。",
        "",
    ]
    for link in links:
        lines.append(f"- [{link.title}](/articles/{link.slug})")
    lines.append("")
    return "\n".join(lines)


def insert_internal_links_section(body: str, section: str) -> str:
    if not section or SECTION_HEADING in body or MARKER in body:
        return body

    faq_heading = "## よくある質問"
    if faq_heading in body:
        return body.replace(faq_heading, section + faq_heading, 1)

    ai_footer = "> 本記事は AI"
    if ai_footer in body:
        index = body.index(ai_footer)
        return body[:index] + section + body[index:]

    return body.rstrip() + "\n\n" + section


def inject_internal_links(body: str, outline: dict, root: Path) -> str:
    articles_dir = root / DEFAULT_ARTICLES_DIR
    articles = load_published_articles(articles_dir)
    links = pick_internal_links(
        category=outline["category"],
        exclude_slug=outline["slug"],
        articles=articles,
    )
    section = build_internal_links_section(links)
    return insert_internal_links_section(body, section)
