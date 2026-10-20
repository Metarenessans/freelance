"""Run with: python -m unittest discover -s dna/tests -v."""
from html import unescape
from html.parser import HTMLParser
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
TEXT_EXTENSIONS = {'.html', '.htm', '.js', '.css', '.sass', '.scss', '.svg', '.json', '.md', '.txt', '.py'}
CYRILLIC = re.compile('[' + chr(0x0400) + '-' + chr(0x052f) + chr(0x2de0) + '-' + chr(0x2dff) + chr(0xa640) + '-' + chr(0xa69f) + ']')


class EnglishContentTests(unittest.TestCase):
    def test_first_party_text_contains_no_cyrillic(self):
        violations = []
        checked = 0
        for path in sorted(ROOT.rglob('*')):
            if not path.is_file() or path.suffix.lower() not in TEXT_EXTENSIONS:
                continue
            if 'lib' in path.relative_to(ROOT).parts:
                continue  # Unmodified third-party dependencies.
            checked += 1
            text = unescape(path.read_text(encoding='utf-8-sig'))
            text = re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m[1], 16)), text)
            text = re.sub(r'\\u\{([0-9a-fA-F]+)\}', lambda m: chr(int(m[1], 16)), text)
            for number, line in enumerate(text.splitlines(), 1):
                if CYRILLIC.search(line):
                    violations.append(f'{path.relative_to(ROOT)}:{number}: {line[:150]}')
        self.assertGreater(checked, 0)
        self.assertEqual([], violations, '\n' + '\n'.join(violations))


    def test_color_selection_has_correct_step_number(self):
        text = (ROOT / 'index.html').read_text(encoding='utf-8')
        step = text.split('class="form-step form-step-3"', 1)[1].split('</h4>', 1)[0]
        self.assertIn('Step 3<br>', step)

    def test_buyer_email_is_labeled_for_the_buyer(self):
        text = (ROOT / 'index.html').read_text(encoding='utf-8')
        label = text.split('class="js-author-email-input"', 1)[0].rsplit('<label>', 1)[1]
        self.assertIn("Buyer's email", label)

    def test_translated_radio_values_match_image_covers(self):
        class Parser(HTMLParser):
            def __init__(self):
                super().__init__()
                self.values = set()
                self.covers = set()
            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                if 'data-type' in attrs:
                    self.covers.add(attrs['data-type'])
                if tag == 'input' and attrs.get('name') in {'pedant-type', 'pedant-color'}:
                    self.values.add(attrs['value'])
        parser = Parser()
        parser.feed((ROOT / 'index.html').read_text(encoding='utf-8'))
        self.assertEqual({'Cylinder', 'Lava', 'Emerald', 'Graphite', 'Amaranth pink', 'Clear'}, parser.values)
        self.assertEqual(parser.values, parser.covers)

    def test_source_and_shipped_bundle_share_english_titles(self):
        for filename in ['main.js', 'main.min.js']:
            text = (ROOT / 'js' / filename).read_text(encoding='utf-8')
            for title in ['Order DNA DROP', 'Gift certificate order', 'Order complete', 'Pendant order']:
                self.assertIn('"' + title + '"', text, filename)

    def test_assets_resolve_under_a_nested_pages_path(self):
        class Parser(HTMLParser):
            def __init__(self):
                super().__init__()
                self.references = []
            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                if tag in {'script', 'img'} and attrs.get('src'):
                    self.references.append(attrs['src'])
                if tag == 'link' and attrs.get('href'):
                    self.references.append(attrs['href'])
        text = (ROOT / 'index.html').read_text(encoding='utf-8')
        self.assertIn('<html lang="en">', text)
        parser = Parser()
        parser.feed(text)
        for reference in parser.references:
            if urlsplit(reference).scheme:
                continue
            self.assertFalse(reference.startswith('/'), reference)
            self.assertTrue((ROOT / reference).is_file(), reference)
        css = ROOT / 'css/main.css'
        for reference in re.findall(r'url\([\s\"\']*([^\)\"\']+)', css.read_text(encoding='utf-8')):
            if reference.startswith('data:'):
                continue
            self.assertFalse(reference.startswith('/'), reference)
            if reference == 'owl.video.play.png':
                continue  # Pre-existing unused vendor video skin asset is absent.
            self.assertTrue((css.parent / reference.split('?', 1)[0].split('#', 1)[0]).is_file(), reference)
        for svg in (ROOT / 'img').rglob('*.svg'):
            ET.parse(svg)


if __name__ == '__main__':
    unittest.main()
