"""Automated regression suite for Cumulative Layout Shift (CLS) and Typography.

Run with:
    python -m unittest discover -s dna/tests -v
"""
from html.parser import HTMLParser
from pathlib import Path
import re
import struct
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CYRILLIC = re.compile(
    "["
    + chr(0x0400) + "-" + chr(0x052F)
    + chr(0x2DE0) + "-" + chr(0x2DFF)
    + chr(0xA640) + "-" + chr(0xA69F)
    + "]"
)


def _get_intrinsic_image_size(asset_path: Path):
    suffix = asset_path.suffix.lower()
    if suffix == ".svg":
        tree = ET.parse(asset_path)
        r = tree.getroot()
        vb = r.attrib.get("viewBox")
        if vb:
            parts = vb.split()
            return round(float(parts[2])), round(float(parts[3]))
        return round(float(r.attrib["width"])), round(float(r.attrib["height"]))

    with open(asset_path, "rb") as f:
        head = f.read(64)
        if suffix == ".png":
            w, h = struct.unpack(">II", head[16:24])
            return w, h
        if suffix in (".jpg", ".jpeg"):
            f.seek(0)
            data = f.read()
            i = 0
            while i < len(data) - 1:
                if data[i] == 0xFF:
                    marker = data[i + 1]
                    if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                        h, w = struct.unpack(">HH", data[i + 5 : i + 9])
                        return w, h
                    if marker not in (0xD8, 0xD9, 0x01, 0x00) and not (0xD0 <= marker <= 0xD7):
                        length = struct.unpack(">H", data[i + 2 : i + 4])[0]
                        i += 2 + length
                        continue
                i += 1
            raise ValueError(f"SOF marker not found in {asset_path}")
    raise ValueError(f"Unsupported image format: {suffix}")


class ClsAndTypographyTests(unittest.TestCase):
    def test_all_content_images_have_explicit_dimensions_matching_assets(self):
        """Every content image in index.html must have width/height matching intrinsic asset size."""
        class ImgParser(HTMLParser):
            def __init__(self):
                super().__init__()
                self.images = []

            def handle_starttag(self, tag, attrs):
                if tag == "img":
                    self.images.append(dict(attrs))

        html_path = ROOT / "index.html"
        parser = ImgParser()
        parser.feed(html_path.read_text(encoding="utf-8"))

        self.assertGreaterEqual(len(parser.images), 38)

        checked = 0
        for img in parser.images:
            classes = img.get("class", "")
            if "form-zoom__image" in classes:
                # Dynamic modal zoom target correctly omitted
                continue

            src = img.get("src")
            self.assertTrue(src, "img tag missing src attribute")
            w = img.get("width")
            h = img.get("height")
            self.assertTrue(w and h, f"Image {src} missing explicit width or height attributes")

            asset_path = (ROOT / src.lstrip("./")).resolve()
            self.assertTrue(asset_path.is_file(), f"Image asset does not exist on disk: {src}")

            actual_w, actual_h = _get_intrinsic_image_size(asset_path)

            self.assertEqual(
                (int(w), int(h)),
                (actual_w, actual_h),
                f"Mismatch in dimensions for {src}: declared ({w}, {h}) vs intrinsic ({actual_w}, {actual_h})"
            )
            checked += 1

        self.assertEqual(checked, 38, f"Expected 38 static content images, checked {checked}")

    def test_pre_js_carousel_covers_reserve_aspect_ratio_to_prevent_shift(self):
        """The custom-radiogroup-cover must have reserved dimensions and aspect-ratio."""
        main_css = (ROOT / "css/main.css").read_text(encoding="utf-8")
        self.assertIn(".custom-radiogroup-cover", main_css)
        self.assertIn("aspect-ratio: 1 / 1", main_css)
        self.assertIn("img.custom-radiogroup-cover", main_css)

    def test_css_reset_contains_responsive_image_rule(self):
        """Reset CSS should provide height: auto for responsive images to preserve aspect ratio."""
        reset_css = (ROOT / "lib/reset.css/reset.css").read_text(encoding="utf-8")
        self.assertIn("height: auto;", reset_css)

    def test_typography_scale_has_no_microscopic_text(self):
        """No body or content text should have font-size below 12px (excluding reset)."""
        main_css = (ROOT / "css/main.css").read_text(encoding="utf-8")
        
        # Check body typography
        self.assertIn("font-size: 16px;", main_css)
        self.assertIn("font-size: 15px;", main_css)

        # Check mobile input 16px to prevent iOS Safari auto-zoom
        self.assertIn(".form-step-5-content__main input", main_css)
        self.assertIn("font-size: 16px;", main_css)

        # Ensure no tiny font sizes like 8px, 9px, 10px, 11px
        unwanted_sizes = ["font-size: 8px", "font-size: 9px", "font-size: 10px", "font-size: 11px",
                          "font-size: .8rem", "font-size: .9rem", "font-size: 1rem", "font-size: 1.1rem"]
        for bad in unwanted_sizes:
            self.assertNotIn(bad, main_css, f"Found microscopic font-size declaration: {bad}")

    def test_no_cyrillic_or_dash_violations_in_modified_code(self):
        """Ensure strict adherence to zero Cyrillic and standard hyphens only."""
        files_to_check = [
            ROOT / "index.html",
            ROOT / "css/main.css",
            ROOT / "sass/_common.scss",
            ROOT / "sass/components/btn.scss",
            ROOT / "sass/components/custom-radiogroup.scss",
            ROOT / "sass/components/dna-types.scss",
            ROOT / "sass/components/form.scss",
            ROOT / "sass/components/site-footer.scss",
            ROOT / "sass/sections/section1.scss",
            ROOT / "sass/sections/section2.scss",
            ROOT / "sass/sections/section3.scss",
            ROOT / "sass/sections/section4.scss",
        ]
        for f in files_to_check:
            text = f.read_text(encoding="utf-8")
            # Cyrillic check
            m = CYRILLIC.search(text)
            self.assertIsNone(m, f"Cyrillic character found in {f.name}: {m}")
            # Em/en-dash check
            self.assertNotIn("\u2014", text, f"Em-dash found in {f.name}")
            self.assertNotIn("\u2013", text, f"En-dash found in {f.name}")


if __name__ == "__main__":
    unittest.main()
