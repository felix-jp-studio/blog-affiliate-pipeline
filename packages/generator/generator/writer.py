"""Write Astro content collection markdown files."""

from __future__ import annotations

from datetime import date
from pathlib import Path


def write_article(
    out_dir: Path,
    outline: dict,
    body: str,
    *,
    draft: bool = False,
) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    slug = outline["slug"]
    path = out_dir / f"{slug}.md"

    priority_line = ""
    if outline.get("priority") is not None:
        priority_line = f"priority: {outline['priority']}\n"

    frontmatter = f"""---
title: "{outline["title"]}"
description: "{outline["metaDescription"]}"
pubDate: {date.today().isoformat()}
category: {outline["category"]}
articleType: {outline["articleType"]}
keyword: "{outline["keyword"]}"
{priority_line}draft: {"true" if draft else "false"}
---

"""
    path.write_text(frontmatter + body.strip() + "\n", encoding="utf-8")
    return path
