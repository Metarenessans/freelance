"""Publication gates for the isolated English portfolio copy."""
from pathlib import Path
import hashlib
import os
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
SKIP = {'.git', '.next', 'node_modules', '.venv', 'venv', '__pycache__', 'staticfiles', '.vercel', '.ruff_cache'}


def source_files():
    for folder, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP]
        for name in files:
            yield Path(folder) / name


class PublicationTests(unittest.TestCase):
    def test_private_runtime_artifacts_are_not_in_publication_copy(self):
        bad = []
        for path in source_files():
            name = path.name
            if ((name == '.env' or name.startswith('.env.')) and not name.endswith('.example')) or path.suffix.lower() in {'.session', '.sqlite3', '.sqlite', '.sql', '.dump', '.log', '.pem', '.pfx', '.p12'} or name.endswith('.sql.gz'):
                bad.append(path.relative_to(ROOT).as_posix())
        self.assertEqual(bad, [])

    def test_application_text_is_english(self):
        bad = []
        for path in source_files():
            if path.suffix.lower() not in {'.py', '.ts', '.tsx', '.js', '.mjs', '.html', '.md', '.css', '.scss', '.yaml', '.yml', '.toml'}:
                continue
            text = path.read_text(encoding='utf-8', errors='replace')
            if re.search(r'[\u0400-\u04ff]', text):
                bad.append(path.relative_to(ROOT).as_posix())
        self.assertEqual(bad, [])

    def test_original_personal_portrait_is_not_published(self):
        portrait = ROOT / 'frontend/public/face-mobile.jpg'
        original_digest = 'a80f8ff26a123015e0c5cbf8c7b4066c3ca63e30d1f0b0b55d07afeeda7fa7f3'
        self.assertNotEqual(hashlib.sha256(portrait.read_bytes()).hexdigest(), original_digest)


if __name__ == '__main__':
    unittest.main()
