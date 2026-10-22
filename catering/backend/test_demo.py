"""Integration checks against a new isolated test database, with all networking blocked."""
import os
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.core.cache import cache
# Imported here so the existing explicit CI test_demo invocation includes these tests.
from apps.orders.test_portfolio_ordering import PortfolioOrderingTests  # noqa: F401
from rest_framework.test import APIClient

from apps.orders.models import EmailSubscriber, Order, TelegramSubscriber
from apps.menu_requests.models import MenuRequest
from apps.system_settings.models import SystemSettings


class SanitizedDemoTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        with patch.dict(os.environ, {"TELEGRAM_ENABLED": "false", "EMAIL_ENABLED": "false", "REVALIDATION_ENABLED": "false"}):
            call_command("load_mock_data", verbosity=0)

    def setUp(self):
        cache.clear()
        demo_env = patch.dict(os.environ, {"DEMO_MODE": "true", "PORTFOLIO_ORDERING_ENABLED": "false"})
        demo_env.start()
        self.addCleanup(demo_env.stop)
        self.client = APIClient()

    def test_catalog_is_english_demo_data(self):
        response = self.client.get("/api/v1/catalog/products/")
        self.assertEqual(response.status_code, 200)
        products = response.data
        self.assertIsInstance(products, list)
        self.assertEqual(len(products), 3)
        self.assertTrue(all(product["name"].startswith("Demo ") for product in products))
        self.assertTrue(all(product["imageUrl"].startswith("http://testserver/media/products/") for product in products))

    def test_personal_records_are_not_seeded(self):
        for model in (get_user_model(), EmailSubscriber, TelegramSubscriber, Order, MenuRequest):
            self.assertEqual(model.objects.count(), 0)

    def test_anonymous_users_cannot_list_customer_records(self):
        for url in ("/api/v1/orders/", "/api/v1/menu-requests/"):
            self.assertIn(self.client.get(url).status_code, (401, 403))

    def test_public_demo_rejects_order_and_menu_submission(self):
        for url in ("/api/v1/orders/", "/api/v1/menu-requests/"):
            response = self.client.post(url, {}, format="json")
            self.assertEqual(response.status_code, 503)
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(MenuRequest.objects.count(), 0)

    def test_public_system_settings_do_not_expose_credentials(self):
        response = self.client.get("/api/v1/system-settings/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.data), {"sitemap_cache_minutes", "enable_debug_json_file", "updated_at"})

    def test_disabled_notifications_make_no_http_request(self):
        from apps.orders.telegram import _send_to_telegram, get_telegram_username_by_phone
        from apps.orders.email import _send_to_email
        from apps.catalog.revalidate import notify_frontend_revalidate
        config = SystemSettings.load()
        config.telegram_bot_token = "example-not-a-real-token"
        config.save()
        with patch.dict(os.environ, {"TELEGRAM_ENABLED": "false", "TELEGRAM_PHONE_LOOKUP_ENABLED": "false", "EMAIL_ENABLED": "false", "REVALIDATION_ENABLED": "false"}):
            with patch("requests.sessions.Session.request", side_effect=AssertionError("Unexpected network access")) as request:
                with patch("urllib.request.urlopen", side_effect=AssertionError("Unexpected network access")) as urlopen:
                    _send_to_telegram("Demo only")
                    _send_to_email("Demo only", "Demo only")
                    self.assertIsNone(get_telegram_username_by_phone("example"))
                    notify_frontend_revalidate()
                    request.assert_not_called()
                    urlopen.assert_not_called()
