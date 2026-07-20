import unittest
from pathlib import Path

from generator.asp_urls import (
    affiliate_host_patterns,
    resolve_carrier_url,
    resolve_program_url,
)


ROOT = Path(__file__).resolve().parents[3]


class AspUrlsTest(unittest.TestCase):
    def test_resolve_program_tracking_url(self):
        url = resolve_program_url(ROOT, "linemo")
        self.assertIn("valuecommerce.com", url)
        self.assertIn("892660854", url)

    def test_resolve_pending_program_fallback(self):
        url = resolve_program_url(ROOT, "ahamo")
        self.assertEqual(url, "https://www.docomo.ne.jp/ahamo/")

    def test_resolve_carrier_via_program_ref(self):
        carrier = {"label": "楽天モバイル", "program": "rakuten-mobile"}
        url = resolve_carrier_url(ROOT, carrier)
        self.assertIn("px.a8.net", url)

    def test_active_provider_host_patterns(self):
        patterns = affiliate_host_patterns(ROOT)
        self.assertIn("px.a8.net", patterns)
        self.assertIn("valuecommerce.com", patterns)
        self.assertNotIn("af.moshimo.com", patterns)


if __name__ == "__main__":
    unittest.main()
