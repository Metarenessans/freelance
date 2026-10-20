"""First-party localization regression checks; run with Python's unittest."""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CYRILLIC = re.compile(r"[\u0400-\u052f\u2de0-\u2dff\ua640-\ua69f]")
TEXT_SUFFIXES = {'.html', '.htm', '.js', '.css', '.scss', '.sass', '.svg',
                 '.json', '.md', '.txt', '.py', '.xml', '.yml', '.yaml',
                 '.code-snippets'}
EXCLUDED = {'lib', 'vendor', 'node_modules', '.git', '__pycache__'}


class EnglishContentTests(unittest.TestCase):
    def test_first_party_text_and_paths_have_no_cyrillic(self):
        failures = []
        checked = 0
        for path in sorted(ROOT.rglob('*')):
            relative = path.relative_to(ROOT)
            if any(part in EXCLUDED for part in relative.parts):
                continue
            if CYRILLIC.search(relative.as_posix()):
                failures.append(f'Non-English path: {relative.as_posix()}')
            if not path.is_file():
                continue
            if path.suffix.lower() not in TEXT_SUFFIXES and path.name not in {'.babelrc', '.gitignore'}:
                continue
            checked += 1
            for number, line in enumerate(path.read_text(encoding='utf-8-sig').splitlines(), 1):
                if CYRILLIC.search(line):
                    failures.append(f'{relative.as_posix()}:{number}: {line.strip()[:180]}')
        print(f'Scanned {checked} first-party textual files (vendor directories excluded).')
        self.assertFalse(failures, '\n' + '\n'.join(failures))

    def test_deployed_html_assets_are_relative_and_exist(self):
        from html.parser import HTMLParser
        from urllib.parse import unquote, urlsplit

        class AssetParser(HTMLParser):
            def __init__(self):
                super().__init__()
                self.assets = []

            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                if 'src' in attrs:
                    self.assets.append(attrs['src'])
                if tag == 'link' and attrs.get('rel') == 'stylesheet':
                    self.assets.append(attrs['href'])

        parser = AssetParser()
        parser.feed((ROOT / 'public/index.html').read_text(encoding='utf-8'))
        self.assertTrue(parser.assets)
        for asset in parser.assets:
            with self.subTest(asset=asset):
                parsed = urlsplit(asset)
                if parsed.scheme or parsed.netloc:
                    continue
                self.assertFalse(parsed.path.startswith('/'), 'Asset must work under /bet-boom/')
                self.assertTrue((ROOT / 'public' / unquote(parsed.path)).is_file())

    def test_source_and_public_html_match_and_use_english(self):
        source = (ROOT / 'src/index.html').read_bytes()
        self.assertEqual(source, (ROOT / 'public/index.html').read_bytes())
        self.assertIn(b'<html lang="en">', source)


if __name__ == '__main__':
    unittest.main(verbosity=2)
