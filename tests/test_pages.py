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

    def test_avatar_and_animations_present(self):
        self.assertTrue((ROOT / 'avatar.png').is_file(), 'avatar.png must exist in root')
        text = (ROOT / 'index.html').read_text(encoding='utf-8') if (ROOT / 'index.html').exists() else ''
        self.assertIn('avatar.png', text)
        self.assertIn('Oleg G.', text)
        self.assertIn('reveal-on-scroll', text)
        self.assertIn('cicd-section', text)
        self.assertIn('badge.svg', text)


if __name__ == '__main__':
    unittest.main()
