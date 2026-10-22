"""Real persistence tests on Django's isolated test DB; no customer fixtures."""
import copy
import os
from decimal import Decimal
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.catalog.models import Product, ProductOption
from apps.orders.models import Order, OrderItem, SubmissionRateBucket


def clear_submission_limits():
    cache.clear()
    SubmissionRateBucket.objects.all().delete()


class PortfolioOrderingTests(TestCase):
    def setUp(self):
        clear_submission_limits()
        self.env = patch.dict(os.environ, {
            "DEMO_MODE": "true", "PORTFOLIO_ORDERING_ENABLED": "true",
            "EMAIL_ENABLED": "false", "TELEGRAM_ENABLED": "false",
            "TELEGRAM_PHONE_LOOKUP_ENABLED": "false", "REVALIDATION_ENABLED": "false",
        })
        self.env.start()
        self.addCleanup(self.env.stop)
        self.client = APIClient()
        self.product = Product.objects.create(name="Synthetic platter", price="3000.00")
        self.payload = {
            "items": [{"id": "cart-local-key", "productId": self.product.pk,
                       "name": "Untrusted name", "imageUrl": "https://example.invalid/fake.jpg",
                       "priceInfo": {"price": "1.00"}, "quantity": 2}],
            "name": "Portfolio tester", "phone": "DEMO-NOT-A-PHONE",
            "totalPrice": 1, "finalPrice": 1,
            "cart_link": "https://example.invalid/?private=unnecessary",
        }

    def submit(self, payload=None):
        return self.client.post("/api/v1/orders/", self.payload if payload is None else payload, format="json")

    def test_opted_in_submission_persists_server_priced_demo_receipt_without_notifications(self):
        with patch("threading.Thread") as thread, patch("requests.sessions.Session.request") as network:
            response = self.submit()
        self.assertEqual(response.status_code, 201, response.data)
        order = Order.objects.get(pk=response.data["id"])
        self.assertTrue(order.is_demo)
        self.assertEqual(order.total_price, Decimal("6000.00"))
        self.assertEqual(order.delivery_cost, Decimal("1500.00"))
        self.assertEqual(order.final_price, Decimal("7500.00"))
        item = order.items.get()
        self.assertEqual(item.product, self.product)
        self.assertEqual(item.product_name, self.product.name)
        self.assertEqual(item.price, Decimal("3000.00"))
        self.assertEqual(item.subtotal, Decimal("6000.00"))
        self.assertEqual(order.cart_link, "")
        self.assertEqual(set(response.data), {"id", "status", "is_demo", "total_price", "delivery_cost", "final_price"})
        thread.assert_not_called()
        network.assert_not_called()

    def test_input_bounds_reject_malformed_or_oversized_orders_without_writes(self):
        changes = [
            ("quantity", 0), ("quantity", -1), ("quantity", 1.5), ("quantity", True),
            ("quantity", 1000), ("quantity", 2.0), ("productId", 999999999),
            ("productId", -1), ("productId", True),
        ]
        for field, value in changes:
            with self.subTest(field=field, value=value):
                clear_submission_limits()
                data = copy.deepcopy(self.payload)
                data["items"][0][field] = value
                self.assertEqual(self.submit(data).status_code, 400)
        for field, value in (("name", "x" * 201), ("phone", "x" * 31),
                             ("comment", "x" * 2001), ("items", self.payload["items"] * 51)):
            with self.subTest(field=field):
                clear_submission_limits()
                data = copy.deepcopy(self.payload)
                data[field] = value
                self.assertEqual(self.submit(data).status_code, 400)
        clear_submission_limits()
        huge = copy.deepcopy(self.payload)
        huge["ignored_blob"] = "x" * 70000
        self.assertEqual(self.submit(huge).status_code, 413)
        self.assertFalse(Order.objects.exists())

    def test_inactive_product_and_category_and_product_minimum_rejected(self):
        from apps.catalog.models import Category
        category = Category.objects.create(name="Hidden", is_active=False)
        for fields in ({"is_active": False}, {"is_active": True, "min_order_quantity": 3},
                       {"min_order_quantity": None, "category": category}):
            clear_submission_limits()
            for field, value in fields.items():
                setattr(self.product, field, value)
            self.product.save()
            self.assertEqual(self.submit().status_code, 400)
        self.assertFalse(Order.objects.exists())

    def test_forged_client_total_cannot_bypass_minimum(self):
        self.payload["items"][0]["quantity"] = 1
        self.payload["items"][0]["priceInfo"]["price"] = "999999.00"
        self.payload["finalPrice"] = 999999
        self.assertEqual(self.submit().status_code, 400)
        self.assertFalse(Order.objects.exists())

    def test_duplicate_lines_rejected_and_item_failure_rolls_back_whole_order(self):
        self.payload["items"] *= 2
        self.assertEqual(self.submit().status_code, 400)
        self.assertFalse(Order.objects.exists())
        self.payload["items"] = self.payload["items"][:1]
        with patch("apps.orders.serializers.OrderItem.objects.create", side_effect=RuntimeError("synthetic insert failure")):
            with self.assertRaises(RuntimeError):
                self.submit()
        self.assertFalse(Order.objects.exists())
        self.assertFalse(OrderItem.objects.exists())

    def test_explicit_opt_in_required_and_default_stays_off(self):
        for value in ("false", "", "1", "yes"):
            with self.subTest(value=value), patch.dict(os.environ, {"PORTFOLIO_ORDERING_ENABLED": value}):
                self.assertEqual(self.submit().status_code, 503)
        with patch.dict(os.environ):
            os.environ.pop("PORTFOLIO_ORDERING_ENABLED", None)
            self.assertEqual(self.submit().status_code, 503)
        self.assertFalse(Order.objects.exists())

    def test_records_are_staff_only_and_visible_to_staff(self):
        from django.contrib.auth import get_user_model
        response = self.submit()
        self.assertEqual(response.status_code, 201)
        pk = response.data["id"]
        for method, url in (("get", "/api/v1/orders/"), ("get", f"/api/v1/orders/{pk}/"),
                            ("patch", f"/api/v1/orders/{pk}/status/"), ("delete", f"/api/v1/orders/{pk}/")):
            self.assertIn(getattr(self.client, method)(url).status_code, (401, 403))
        user = get_user_model().objects.create_user(username="synthetic-member", password=None)
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get("/api/v1/orders/").status_code, 403)
        user.is_staff = True
        user.save()
        self.assertEqual(self.client.get(f"/api/v1/orders/{pk}/").status_code, 200)

    def test_public_rate_limit_returns_429(self):
        codes = [self.submit({}).status_code for _ in range(6)]
        self.assertEqual(codes, [400] * 5 + [429])
        self.assertFalse(Order.objects.exists())

    def test_outbound_notifications_are_scheduled_when_enabled(self):
        from apps.orders.telegram import _send_to_telegram, send_order_telegram_notification
        flags = {"EMAIL_ENABLED": "false", "TELEGRAM_ENABLED": "true",
                 "TELEGRAM_BOT_TOKEN": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
                 "TELEGRAM_CHAT_ID": "987654321"}
        with patch.dict(os.environ, flags), patch("threading.Thread") as threads, \
                patch("requests.post") as network:
            response = self.submit()
            self.assertEqual(response.status_code, 201)
            order = Order.objects.get()
            send_order_telegram_notification(order)
            self.assertTrue(threads.called)
            _send_to_telegram("Test message")
            network.assert_called_once()
            args, kwargs = network.call_args
            self.assertIn("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11", args[0])
            self.assertEqual(kwargs["json"]["chat_id"], "987654321")
            self.assertEqual(kwargs["json"]["text"], "Test message")

        # When notifications are disabled via OUTBOUND_NOTIFICATIONS_DISABLED, threads are not scheduled.
        with patch.dict(os.environ, {"OUTBOUND_NOTIFICATIONS_DISABLED": "true", "TELEGRAM_ENABLED": "true"}), \
                patch("threading.Thread") as threads, patch("requests.post") as network:
            send_order_telegram_notification(order)
            threads.assert_not_called()
            _send_to_telegram("Never send")
            network.assert_not_called()

    def test_menu_request_persists_demo_with_private_receipt_and_no_notifications(self):
        from apps.menu_requests.models import MenuRequest
        payload = {"format": "Buffet", "guests": "10", "budget": "10000",
                   "name": "Synthetic quote", "phone": "DEMO", "consent": True, "additional": []}
        with patch("threading.Thread") as threads:
            response = self.client.post("/api/v1/menu-requests/", payload, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(MenuRequest.objects.get(pk=response.data["id"]).is_demo)
        self.assertEqual(set(response.data), {"id", "status", "is_demo"})
        threads.assert_not_called()
        self.assertIn(self.client.get("/api/v1/menu-requests/").status_code, (401, 403))
        clear_submission_limits()
        payload["additional"] = ["x" * 201]
        self.assertEqual(self.client.post("/api/v1/menu-requests/", payload, format="json").status_code, 400)

    def test_invalid_catalog_prices_and_overflow_cannot_create_orders(self):
        for price, quantity in (("-10.00", 2), ("0.00", 2), ("99999999.99", 999)):
            clear_submission_limits()
            self.product.price = price
            self.product.save()
            self.payload["items"][0]["quantity"] = quantity
            self.assertEqual(self.submit().status_code, 400)
        self.assertFalse(Order.objects.exists())

    def test_malformed_legacy_product_id_fails_validation_not_server_error(self):
        del self.payload["items"][0]["productId"]
        for value in ("²", "9" * 100, "-2", "local-cart-key"):
            clear_submission_limits()
            self.payload["items"][0]["id"] = value
            self.assertEqual(self.submit().status_code, 400)

    def test_persisted_demo_record_is_visible_in_authenticated_django_admin(self):
        from django.contrib.auth import get_user_model
        self.assertEqual(self.submit().status_code, 201)
        owner = get_user_model().objects.create_superuser("synthetic-owner", password=None)
        self.client.force_login(owner)
        response = self.client.get(f"/admin/orders/order/{Order.objects.get().pk}/change/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Portfolio / sandbox")
        self.assertContains(response, "Synthetic platter")

    def test_public_rate_limit_survives_worker_cache_reset_and_ignores_forwarded_spoofing(self):
        for _ in range(5):
            self.assertEqual(self.submit({}).status_code, 400)
        cache.clear()
        response = self.client.post("/api/v1/menu-requests/", {}, format="json", HTTP_X_FORWARDED_FOR="203.0.113.77")
        self.assertEqual(response.status_code, 429)
        other = self.client.post("/api/v1/orders/", {}, format="json", REMOTE_ADDR="203.0.113.88")
        self.assertEqual(other.status_code, 400)

    def test_quote_additional_values_cannot_inject_admin_html_or_reference_inactive_services(self):
        from apps.menu_requests.models import AdditionalService, MenuRequest
        inactive = AdditionalService.objects.create(label="Hidden", is_active=False)
        payload = {"format": "Buffet", "name": "Synthetic", "phone": "DEMO", "consent": True}
        for value in ("<img src=x onerror=alert(1)>", "999999", str(inactive.pk), "9" * 100):
            clear_submission_limits()
            payload["additional"] = [value]
            response = self.client.post("/api/v1/menu-requests/", payload, format="json")
            self.assertEqual(response.status_code, 400)
        self.assertFalse(MenuRequest.objects.exists())

    def test_selected_option_uses_catalog_price_and_persists_snapshot(self):
        option = ProductOption.objects.create(product=self.product, name="Party size", price="4000.00", min_order_quantity=2)
        self.payload["items"][0]["selectedOption"] = {"id": str(option.pk), "price": 1, "name": "forged"}
        response = self.submit()
        self.assertEqual(response.status_code, 201, response.data)
        item = OrderItem.objects.get()
        self.assertEqual(item.price, Decimal("4000.00"))
        self.assertEqual(item.option_id, option.pk)
        self.assertEqual(item.option_name, "Party size")
        self.assertEqual(item.order.total_price, Decimal("8000.00"))

    def test_option_id_alias_and_minimums_are_validated(self):
        option = ProductOption.objects.create(product=self.product, name="Party", price="4000.00", min_order_quantity=3)
        self.payload["items"][0]["optionId"] = option.pk
        self.assertEqual(self.submit().status_code, 400)
        self.assertFalse(Order.objects.exists())
        self.payload["items"][0]["quantity"] = 3
        self.assertEqual(self.submit().status_code, 201)

    def test_missing_inactive_or_foreign_options_are_rejected(self):
        other = Product.objects.create(name="Other", price="6000.00")
        own = ProductOption.objects.create(product=self.product, name="Own", price="4000.00")
        foreign = ProductOption.objects.create(product=other, name="Other", price="6000.00")
        inactive = ProductOption.objects.create(product=self.product, name="Inactive", price="4000.00", is_active=False)
        for value in (None, 999999, foreign.pk, inactive.pk, -1, True, "not-an-id"):
            with self.subTest(option=value):
                clear_submission_limits()
                data = copy.deepcopy(self.payload)
                if value is not None:
                    data["items"][0]["optionId"] = value
                self.assertEqual(self.submit(data).status_code, 400)
        self.assertFalse(Order.objects.exists())
