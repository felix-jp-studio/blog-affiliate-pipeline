"""Schema validation for config/batch-*.json generation batches."""

from __future__ import annotations

import json
from pathlib import Path

VALID_ARTICLE_TYPES = ("comparison", "howto", "troubleshoot", "crosssell")
VALID_CATEGORIES = ("sim", "hikari", "trouble", "cost")

TOP_LEVEL_KEYS = ("description", "items")
ITEM_REQUIRED_KEYS = ("keyword", "articleType", "category")
ITEM_OPTIONAL_KEYS = ("priority",)


class BatchConfigError(ValueError):
    """Raised when a batch config does not match the expected schema."""


def validate_batch_config(data: object, *, source: str = "batch config") -> list[str]:
    """Return a list of human readable schema errors (empty list = valid)."""
    if not isinstance(data, dict):
        return [f"{source}: top level must be an object"]

    errors: list[str] = []
    for key in sorted(set(data) - set(TOP_LEVEL_KEYS)):
        errors.append(f"{source}: unknown top level key `{key}`")

    description = data.get("description")
    if description is not None and not _is_filled_str(description):
        errors.append(f"{source}: description must be a non-empty string")

    items = data.get("items")
    if not isinstance(items, list):
        errors.append(f"{source}: items must be an array")
        return errors
    if not items:
        errors.append(f"{source}: items must not be empty")
        return errors

    seen_keywords: dict[str, int] = {}
    seen_priorities: dict[int, int] = {}
    for index, item in enumerate(items):
        where = f"{source}: items[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{where} must be an object")
            continue

        allowed = set(ITEM_REQUIRED_KEYS) | set(ITEM_OPTIONAL_KEYS)
        for key in sorted(set(item) - allowed):
            errors.append(f"{where}: unknown key `{key}`")

        for key in ITEM_REQUIRED_KEYS:
            if key not in item:
                errors.append(f"{where}: missing `{key}`")
            elif not _is_filled_str(item[key]):
                errors.append(f"{where}: `{key}` must be a non-empty string")

        article_type = item.get("articleType")
        if _is_filled_str(article_type) and article_type not in VALID_ARTICLE_TYPES:
            errors.append(
                f"{where}: articleType `{article_type}` "
                f"not in {', '.join(VALID_ARTICLE_TYPES)}"
            )

        category = item.get("category")
        if _is_filled_str(category) and category not in VALID_CATEGORIES:
            errors.append(
                f"{where}: category `{category}` not in {', '.join(VALID_CATEGORIES)}"
            )

        priority = item.get("priority")
        if priority is not None:
            if not isinstance(priority, int) or isinstance(priority, bool):
                errors.append(f"{where}: priority must be an integer")
            elif priority < 1:
                errors.append(f"{where}: priority must be >= 1")
            elif priority in seen_priorities:
                errors.append(
                    f"{where}: duplicate priority {priority} "
                    f"(also items[{seen_priorities[priority]}])"
                )
            else:
                seen_priorities[priority] = index

        keyword = item.get("keyword")
        if _is_filled_str(keyword):
            if keyword in seen_keywords:
                errors.append(
                    f"{where}: duplicate keyword `{keyword}` "
                    f"(also items[{seen_keywords[keyword]}])"
                )
            else:
                seen_keywords[keyword] = index

    return errors


def load_batch_config(batch_path: Path) -> dict:
    """Read and validate a batch config, raising BatchConfigError when invalid."""
    source = batch_path.name
    try:
        data = json.loads(batch_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise BatchConfigError(f"{source}: invalid JSON ({e})") from e

    errors = validate_batch_config(data, source=source)
    if errors:
        raise BatchConfigError("\n".join(errors))
    return data


def _is_filled_str(value: object) -> bool:
    return isinstance(value, str) and value.strip() != ""
