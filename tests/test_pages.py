"""Regression checks for the static portfolio publication."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class PagesTests(unittest.TestCase):
    def test_catalog_links_to_both_demos(self):
        text = (ROOT / 'index.html').read_text(encoding='utf-8') if (ROOT / 'index.html').exists() else ''
        self.assertIn('href="bet-boom/"', text)
        self.assertIn('href="dna/"', text)
        self.assertIn('lang="en"', text)


if __name__ == '__main__':
    unittest.main()
