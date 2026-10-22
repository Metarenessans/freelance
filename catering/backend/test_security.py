"""Offline regression tests; never load Django, credentials, or the database."""
import ast
import os
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent


def isolated_function(path, name):
    tree = ast.parse(path.read_text(encoding="utf-8-sig"))
    function = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == name)
    namespace = {"os": os}
    exec(compile(ast.Module(body=[function], type_ignores=[]), str(path), "exec"), namespace)
    def call(*args, **kwargs):
        try:
            return namespace[name](*args, **kwargs)
        except Exception as exc:
            raise AssertionError("Disabled outbound function accessed external dependencies before its safety guard") from None
    return call


class OutboundSafetyTests(unittest.TestCase):
    def test_bot_api_disabled_without_explicit_opt_in(self):
        fn = isolated_function(ROOT.parent / "telegram-bot/main.py", "api_request")
        with patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(fn("sendMessage", {"chat_id": "example", "text": "test"}))

    def test_bot_polling_disabled_without_explicit_opt_in(self):
        fn = isolated_function(ROOT.parent / "telegram-bot/main.py", "get_updates")
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(fn(None), [])

    def test_backend_telegram_disabled_even_with_credentials_in_environment(self):
        fn = isolated_function(ROOT / "apps/orders/telegram.py", "_send_to_telegram")
        with patch.dict(os.environ, {"TELEGRAM_BOT_TOKEN": "example-not-a-token"}, clear=True):
            self.assertIsNone(fn("test"))

    def test_phone_lookup_disabled_without_explicit_opt_in(self):
        fn = isolated_function(ROOT / "apps/orders/telegram.py", "get_telegram_username_by_phone")
        with patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(fn("example"))

    def test_email_disabled_without_explicit_opt_in(self):
        fn = isolated_function(ROOT / "apps/orders/email.py", "_send_to_email")
        with patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(fn("test", "test"))

    def test_revalidation_disabled_without_explicit_opt_in(self):
        fn = isolated_function(ROOT / "apps/catalog/revalidate.py", "notify_frontend_revalidate")
        with patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(fn())


if __name__ == "__main__":
    unittest.main()
