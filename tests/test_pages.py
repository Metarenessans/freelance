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
        self.assertIn('Automated CI/CD', text)

    def test_flagship_catering_source_present(self):
        self.assertTrue((ROOT / 'catering').is_dir(), 'catering folder must exist in root')
        self.assertTrue((ROOT / 'catering/frontend').is_dir(), 'catering frontend must exist')
        self.assertTrue((ROOT / 'catering/backend').is_dir(), 'catering backend must exist')
        self.assertTrue((ROOT / 'catering/telegram-bot').is_dir(), 'catering telegram-bot must exist')

    def test_favicon_present(self):
        self.assertTrue((ROOT / 'favicon.svg').is_file(), 'favicon.svg must exist')
        self.assertTrue((ROOT / 'favicon.ico').is_file(), 'favicon.ico must exist')
        text = (ROOT / 'index.html').read_text(encoding='utf-8') if (ROOT / 'index.html').exists() else ''
        self.assertIn('favicon.svg', text)

    def test_modular_scss_and_compiled_css_present(self):
        self.assertTrue((ROOT / 'scss/main.scss').is_file(), 'scss/main.scss must exist')
        self.assertTrue((ROOT / 'scss/_responsive.scss').is_file(), 'scss/_responsive.scss must exist')
        self.assertTrue((ROOT / 'css/style.css').is_file(), 'css/style.css must exist')
        text = (ROOT / 'index.html').read_text(encoding='utf-8') if (ROOT / 'index.html').exists() else ''
        self.assertIn('href="css/style.css"', text)


if __name__ == '__main__':
    unittest.main()
