#!/usr/bin/env python3
"""Validate config/batch-*.json generation batches against the expected schema."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages/generator"))

from generator.batch_config import BatchConfigError, load_batch_config  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate batch config JSON used by `python3 -m generator --batch`.",
    )
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="Batch config files to check (default: config/batch-*.json).",
    )
    paths = parser.parse_args().paths or sorted((ROOT / "config").glob("batch-*.json"))
    if not paths:
        print("No batch config found.", file=sys.stderr)
        return 1

    errors: list[str] = []
    for path in paths:
        try:
            load_batch_config(path)
        except BatchConfigError as e:
            errors.extend(str(e).splitlines())
        except OSError as e:
            errors.append(f"{path}: {e.strerror}")

    for error in errors:
        print(error, file=sys.stderr)
    print(f"Checked {len(paths)} batch config(s): {len(errors)} error(s).")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
