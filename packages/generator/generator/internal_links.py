"""Inject in-body internal links to same-category and cross-entity articles."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path

SECTION_HEADING = "## あわせて読みたい"
MARKER_V1 = "<!-- internal-links:v1 -->"
MARKER_V2 = "<!-- internal-links:v2 -->"
MARKER = "<!-- internal-links:v5 -->"
MARKERS = (MARKER, "<!-- internal-links:v4 -->", MARKER_V2, MARKER_V1)
FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---", re.DOTALL)
SECTION_RE = re.compile(
    r"(?:<!-- internal-links:v[1245] -->\s*)?## あわせて読みたい\n.*?(?=\n## |\n> 本記事は AI|\Z)",
    re.DOTALL,
)
DEFAULT_ARTICLES_DIR = "site/src/content/articles"
SAME_CATEGORY_COUNT = 2
CROSS_ENTITY_COUNT = 2
ROTATION_SALT = 5

# Cross-entity mesh for visitability: SIM↔光, 障害↔乗り換え/セット, 固定費↔通信.
RELATED_CATEGORIES: dict[str, tuple[str, ...]] = {
    "sim": ("hikari", "trouble", "cost"),
    "hikari": ("sim", "trouble", "cost"),
    "trouble": ("sim", "hikari", "cost"),
    "cost": ("sim", "hikari", "trouble"),
}

# Prefer howto / switch-related peers when linking from trouble (障害→乗り換え).
CROSS_TYPE_PREFERENCE: dict[str, tuple[str, ...]] = {
    "trouble": ("howto", "comparison", "troubleshoot", "crosssell"),
    "sim": ("comparison", "howto", "crosssell", "troubleshoot"),
    "hikari": ("comparison", "howto", "crosssell", "troubleshoot"),
    "cost": ("crosssell", "comparison", "howto", "troubleshoot"),
}


@dataclass(frozen=True)
class ArticleRef:
    slug: str
    title: str
    category: str
    article_type: str
    pub_date: date


def _bump_date_modified(frontmatter: str, today: str | None = None) -> str:
    stamp = today or date.today().isoformat()
    if re.search(r"^dateModified:\s*\S+\s*$", frontmatter, re.MULTILINE):
        return re.sub(
            r"^dateModified:\s*\S+\s*$",
            f"dateModified: {stamp}",
            frontmatter,
            count=1,
            flags=re.MULTILINE,
        )
    return f"{frontmatter.rstrip()}\ndateModified: {stamp}"


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
        article_type = _parse_field(r"^articleType:\s*(\w+)\s*$", frontmatter) or "comparison"
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
                article_type=article_type,
                pub_date=pub_date,
            )
        )

    return articles


def _type_rank(category: str, article_type: str) -> int:
    preference = CROSS_TYPE_PREFERENCE.get(category, ())
    try:
        return preference.index(article_type)
    except ValueError:
        return len(preference)


def _slug_rotation_offset(slug: str, pool_size: int) -> int:
    if pool_size <= 0:
        return 0
    base = sum(ord(char) for char in slug)
    return (base + ROTATION_SALT * 31) % pool_size


def _rotate_refs(articles: list[ArticleRef], offset: int) -> list[ArticleRef]:
    if not articles or offset <= 0:
        return articles
    normalized = offset % len(articles)
    if normalized == 0:
        return articles
    return articles[normalized:] + articles[:normalized]


def pick_same_category_links(
    *,
    category: str,
    exclude_slug: str,
    articles: list[ArticleRef],
    count: int = SAME_CATEGORY_COUNT,
) -> list[ArticleRef]:
    candidates = [
        article
        for article in articles
        if article.category == category and article.slug != exclude_slug
    ]
    candidates.sort(key=lambda article: (article.pub_date, article.slug), reverse=True)
    rotated = _rotate_refs(
        candidates,
        _slug_rotation_offset(exclude_slug, len(candidates)),
    )
    return rotated[:count]


def pick_cross_entity_links(
    *,
    category: str,
    exclude_slug: str,
    articles: list[ArticleRef],
    exclude_slugs: set[str] | None = None,
    count: int = CROSS_ENTITY_COUNT,
) -> list[ArticleRef]:
    related = RELATED_CATEGORIES.get(category, ())
    if not related or count <= 0:
        return []

    blocked = set(exclude_slugs or ())
    blocked.add(exclude_slug)
    candidates = [
        article
        for article in articles
        if article.category in related and article.slug not in blocked
    ]
    related_rank = {name: index for index, name in enumerate(related)}
    candidates.sort(
        key=lambda article: (
            related_rank.get(article.category, 99),
            _type_rank(category, article.article_type),
            -article.pub_date.toordinal(),
            article.slug,
        )
    )
    candidates = _rotate_refs(
        candidates,
        _slug_rotation_offset(exclude_slug, len(candidates)),
    )

    # Prefer one article per related category first (SIM↔光, 障害↔乗り換え).
    picked: list[ArticleRef] = []
    seen_categories: set[str] = set()
    for related_category in related:
        if len(picked) >= count:
            break
        for article in candidates:
            if article.category != related_category or article.category in seen_categories:
                continue
            picked.append(article)
            seen_categories.add(article.category)
            break

    if len(picked) < count:
        picked_slugs = {article.slug for article in picked}
        for article in candidates:
            if article.slug in picked_slugs:
                continue
            picked.append(article)
            if len(picked) >= count:
                break

    return picked[:count]


def pick_internal_links(
    *,
    category: str,
    exclude_slug: str,
    articles: list[ArticleRef],
    count: int = SAME_CATEGORY_COUNT,
) -> list[ArticleRef]:
    """Backward-compatible: same-category picks only (v1 behavior)."""
    return pick_same_category_links(
        category=category,
        exclude_slug=exclude_slug,
        articles=articles,
        count=count,
    )


def pick_internal_links_v2(
    *,
    category: str,
    exclude_slug: str,
    articles: list[ArticleRef],
    same_count: int = SAME_CATEGORY_COUNT,
    cross_count: int = CROSS_ENTITY_COUNT,
) -> list[ArticleRef]:
    same = pick_same_category_links(
        category=category,
        exclude_slug=exclude_slug,
        articles=articles,
        count=same_count,
    )
    cross = pick_cross_entity_links(
        category=category,
        exclude_slug=exclude_slug,
        articles=articles,
        exclude_slugs={article.slug for article in same},
        count=cross_count,
    )
    return same + cross


def build_internal_links_section(links: list[ArticleRef]) -> str:
    if not links:
        return ""

    categories = {link.category for link in links}
    if len(categories) <= 1:
        intro = "同じカテゴリの関連記事もあわせてご確認ください。"
    else:
        intro = "同じカテゴリに加え、セット割・乗り換え・お困り解決の関連記事もあわせてご確認ください。"

    lines = [
        MARKER,
        SECTION_HEADING,
        "",
        intro,
        "",
    ]
    for link in links:
        lines.append(f"- [{link.title}](/articles/{link.slug})")
    lines.append("")
    return "\n".join(lines)


def insert_internal_links_section(body: str, section: str) -> str:
    if not section:
        return body
    if any(marker in body for marker in MARKERS) or SECTION_HEADING in body:
        return body

    faq_heading = "## よくある質問"
    if faq_heading in body:
        return body.replace(faq_heading, section + faq_heading, 1)

    ai_footer = "> 本記事は AI"
    if ai_footer in body:
        index = body.index(ai_footer)
        return body[:index] + section + body[index:]

    return body.rstrip() + "\n\n" + section


def replace_internal_links_section(body: str, section: str) -> str:
    """Replace an existing あわせて読みたい block (v1/v2) with a new section."""
    if not section:
        return body
    if SECTION_RE.search(body):
        return SECTION_RE.sub(section.rstrip() + "\n\n", body, count=1)
    return insert_internal_links_section(body, section)


def inject_internal_links(body: str, outline: dict, root: Path) -> str:
    articles_dir = root / DEFAULT_ARTICLES_DIR
    articles = load_published_articles(articles_dir)
    links = pick_internal_links_v2(
        category=outline["category"],
        exclude_slug=outline["slug"],
        articles=articles,
    )
    section = build_internal_links_section(links)
    return insert_internal_links_section(body, section)


def backfill_article_file(
    path: Path,
    root: Path,
    *,
    write: bool = True,
    upgrade_v1: bool = False,
    force: bool = False,
) -> bool:
    """Inject or upgrade internal links in an existing article. Returns True if modified."""
    text = path.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(text)
    if not match:
        return False

    frontmatter = match.group(1)
    body = text[match.end() :].lstrip("\n")

    if _parse_field(r"^draft:\s*(true|false)\s*$", frontmatter) == "true":
        return False

    category = _parse_field(r"^category:\s*(\w+)\s*$", frontmatter)
    if not category:
        return False

    has_v4 = MARKER in body
    has_v2 = MARKER_V2 in body
    has_v1 = MARKER_V1 in body or (SECTION_HEADING in body and not has_v4 and not has_v2)
    if has_v4 and not force:
        return False
    if (has_v2 or has_v1) and not upgrade_v1 and not force:
        return False

    articles = load_published_articles(root / DEFAULT_ARTICLES_DIR)
    links = pick_internal_links_v2(
        category=category,
        exclude_slug=path.stem,
        articles=articles,
    )
    section = build_internal_links_section(links)
    if not section:
        return False

    if has_v1 or has_v2 or has_v4:
        new_body = replace_internal_links_section(body, section)
    else:
        new_body = insert_internal_links_section(body, section)

    if new_body == body:
        return False

    if write:
        updated_frontmatter = _bump_date_modified(frontmatter)
        path.write_text(
            f"---\n{updated_frontmatter}\n---\n{new_body}",
            encoding="utf-8",
        )
    return True
