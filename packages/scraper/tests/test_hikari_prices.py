"""Unit tests for hikari price scraper v1 (fixture-based, no live HTTP)."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scraper.hikari_prices import (
    parse_price_html,
    run_snapshot,
)

FIXTURE_DIR = Path(__file__).resolve().parent / "fixtures"


class ParsePriceHtmlTests(unittest.TestCase):
    def test_nuro_fixture_extracts_monthly_and_construction(self):
        html = (FIXTURE_DIR / "nuro-hikari.html").read_text(encoding="utf-8")
        parsed = parse_price_html(html, provider="nuro-hikari")
        self.assertEqual(parsed["monthlyFeeYen"], 5200)
        self.assertEqual(parsed["constructionFeeYen"], 0)
        self.assertEqual(parsed["parseStatus"], "parsed")
        self.assertIsNotNone(parsed["campaignNote"])


class RunSnapshotFixtureTests(unittest.TestCase):
    def test_fixture_snapshot_writes_v1_shape(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "hikari-prices-snapshot.json"
            snapshot = run_snapshot(fixture_dir=FIXTURE_DIR, output=out, dry_run=False)
            self.assertEqual(snapshot["version"], "1")
            self.assertEqual(snapshot["source"], "fixture")
            self.assertEqual(snapshot["summary"]["ok"], 4)
            self.assertTrue(out.is_file())
            loaded = json.loads(out.read_text(encoding="utf-8"))
            self.assertIn("nuro-hikari", loaded["providers"])
            self.assertEqual(loaded["providers"]["nuro-hikari"]["monthlyFeeYen"], 5200)
            self.assertIn("rewriteSlugs", loaded["providers"]["nuro-hikari"])

    def test_dry_run_does_not_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "should-not-exist.json"
            run_snapshot(fixture_dir=FIXTURE_DIR, output=out, dry_run=True)
            self.assertFalse(out.exists())


if __name__ == "__main__":
    unittest.main()
