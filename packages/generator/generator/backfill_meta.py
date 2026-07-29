"""Backfill title/description frontmatter using meta title templates v1."""

from __future__ import annotations

import re
from pathlib import Path

from generator.template_articles import build_meta_description, build_meta_title

FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---", re.DOTALL)
TITLE_RE = re.compile(r'^title:\s*"(.*)"\s*$', re.MULTILINE)
DESCRIPTION_RE = re.compile(r'^description:\s*"(.*)"\s*$', re.MULTILINE)
KEYWORD_RE = re.compile(r'^keyword:\s*"(.*)"\s*$', re.MULTILINE)
ARTICLE_TYPE_RE = re.compile(r"^articleType:\s*(\w+)\s*$", re.MULTILINE)
DRAFT_RE = re.compile(r"^draft:\s*(true|false)\s*$", re.MULTILINE)


def backfill_meta_file(path: Path, *, write: bool = True) -> bool:
    text = path.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(text)
    if not match:
        return False

    frontmatter = match.group(1)
    draft_match = DRAFT_RE.search(frontmatter)
    if draft_match and draft_match.group(1) == "true":
        return False

    keyword_match = KEYWORD_RE.search(frontmatter)
    type_match = ARTICLE_TYPE_RE.search(frontmatter)
    if not keyword_match or not type_match:
        return False

    keyword = keyword_match.group(1)
    article_type = type_match.group(1)
    new_title = build_meta_title(keyword, article_type)
    new_description = build_meta_description(keyword, article_type)

    title_match = TITLE_RE.search(frontmatter)
    desc_match = DESCRIPTION_RE.search(frontmatter)
    if not title_match or not desc_match:
        return False

    if title_match.group(1) == new_title and desc_match.group(1) == new_description:
        return False

    updated_frontmatter = TITLE_RE.sub(f'title: "{new_title}"', frontmatter, count=1)
    updated_frontmatter = DESCRIPTION_RE.sub(
        f'description: "{new_description}"',
        updated_frontmatter,
        count=1,
    )

    if write:
        path.write_text(
            text[: match.start(1)] + updated_frontmatter + text[match.end(1) :],
            encoding="utf-8",
        )
    return True
