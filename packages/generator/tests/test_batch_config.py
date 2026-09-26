import json
import tempfile
import unittest
from pathlib import Path

from generator.batch_config import (
    BatchConfigError,
    load_batch_config,
    validate_batch_config,
)

ROOT = Path(__file__).resolve().parents[3]

ITEMS = [
    {
        "keyword": "格安SIM 20GB 比較 2026",
        "articleType": "comparison",
        "category": "sim",
        "priority": 1,
    },
    {
        "keyword": "光回線 繋がらない 対処",
        "articleType": "troubleshoot",
        "category": "trouble",
        "priority": 2,
    },
]
VALID = {"description": "Cycle 99 batch — priority 1, 2", "items": ITEMS}


def _with_item(**overrides) -> dict:
    return {"items": [{**ITEMS[0], **overrides}]}


def _write(tmp: str, name: str, text: str) -> Path:
    path = Path(tmp) / name
    path.write_text(text, encoding="utf-8")
    return path


class ValidateBatchConfigTest(unittest.TestCase):
    def assertFirstError(self, config, expected, **kwargs):
        errors = validate_batch_config(config, **kwargs)
        self.assertTrue(errors, f"expected an error containing {expected!r}")
        self.assertIn(expected, errors[0])

    def test_accepts_valid_config(self):
        self.assertEqual(validate_batch_config(VALID), [])

    def test_priority_is_optional(self):
        config = _with_item()
        del config["items"][0]["priority"]
        self.assertEqual(validate_batch_config(config), [])

    def test_rejects_non_object_top_level(self):
        self.assertEqual(
            validate_batch_config([], source="x.json"),
            ["x.json: top level must be an object"],
        )

    def test_rejects_unknown_keys(self):
        self.assertFirstError({**VALID, "mode": "auto"}, "unknown top level key `mode`")
        self.assertFirstError(_with_item(slug="sim-20gb"), "unknown key `slug`")

    def test_rejects_missing_or_empty_required_fields(self):
        config = _with_item()
        del config["items"][0]["keyword"]
        self.assertFirstError(config, "missing `keyword`")
        self.assertFirstError(
            _with_item(category="  "), "`category` must be a non-empty string"
        )

    def test_rejects_empty_or_missing_items(self):
        self.assertFirstError({}, "items must be an array")
        self.assertFirstError({"items": []}, "items must not be empty")

    def test_rejects_unknown_article_type_and_category(self):
        self.assertFirstError(_with_item(articleType="review"), "articleType `review`")
        self.assertFirstError(_with_item(category="mobile"), "category `mobile`")

    def test_rejects_invalid_priority(self):
        self.assertFirstError(_with_item(priority="1"), "priority must be an integer")
        self.assertFirstError(_with_item(priority=True), "priority must be an integer")
        self.assertFirstError(_with_item(priority=0), "priority must be >= 1")

    def test_rejects_duplicates_within_a_file(self):
        self.assertFirstError(
            {"items": [ITEMS[0], {**ITEMS[0], "priority": 3}]}, "duplicate keyword"
        )
        self.assertFirstError(
            {"items": [ITEMS[0], {**ITEMS[1], "priority": 1}]}, "duplicate priority 1"
        )

    def test_reports_every_error_at_once(self):
        errors = validate_batch_config(
            {"items": [{"articleType": "review", "category": "mobile"}]},
            source="broken.json",
        )
        self.assertEqual(len(errors), 3)
        self.assertTrue(all(e.startswith("broken.json: items[0]") for e in errors))


class LoadBatchConfigTest(unittest.TestCase):
    def test_loads_valid_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = _write(tmp, "batch-cycle99.json", json.dumps(VALID))
            self.assertEqual(load_batch_config(path)["items"], ITEMS)

    def test_raises_on_invalid_json_or_schema(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(BatchConfigError, "invalid JSON"):
                load_batch_config(_write(tmp, "batch-broken.json", "{"))
            with self.assertRaisesRegex(BatchConfigError, "items must not be empty"):
                load_batch_config(_write(tmp, "batch-empty.json", '{"items": []}'))

    def test_all_committed_batch_configs_are_valid(self):
        paths = sorted((ROOT / "config").glob("batch-*.json"))
        self.assertTrue(paths, "no batch config found under config/")
        errors: list[str] = []
        for path in paths:
            try:
                load_batch_config(path)
            except BatchConfigError as e:
                errors.extend(str(e).splitlines())
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
