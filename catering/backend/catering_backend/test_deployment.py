"""Deployment-specific settings checks; no database or network access."""
import importlib.util
import os
from pathlib import Path
import unittest
from unittest.mock import patch


class DeploymentSettingsTests(unittest.TestCase):
    def load_settings(self, **values):
        env = {"SECRET_KEY": "test-only-value-not-a-deployment-key", "DB_ENGINE": "sqlite", **values}
        with patch.dict(os.environ, env, clear=True):
            spec = importlib.util.spec_from_file_location("isolated_deployment_settings", Path(__file__).with_name("settings.py"))
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return module

    def test_published_demo_media_uses_static_snapshot(self):
        settings = self.load_settings(PUBLISH_DEMO_MEDIA="true")
        self.assertIn(("demo-media", settings.MEDIA_ROOT), settings.STATICFILES_DIRS)

    def test_media_snapshot_is_not_enabled_by_default(self):
        settings = self.load_settings()
        self.assertEqual(getattr(settings, "STATICFILES_DIRS", []), [])

    def test_trusted_proxy_reports_https_only_when_opted_in(self):
        self.assertEqual(self.load_settings(TRUST_PROXY_SSL="true").SECURE_PROXY_SSL_HEADER, ("HTTP_X_FORWARDED_PROTO", "https"))
        self.assertFalse(hasattr(self.load_settings(), "SECURE_PROXY_SSL_HEADER"))


if __name__ == "__main__":
    unittest.main()
