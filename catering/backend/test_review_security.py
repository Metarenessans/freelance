"""Review regressions: isolated DB, Telegram transport never used."""
import importlib.util
import os
from pathlib import Path
from unittest.mock import patch

from django.test import TestCase, SimpleTestCase
from django.contrib.admin.sites import AdminSite
from types import SimpleNamespace

from apps.orders.admin import OrderAdmin, OrderItemInline
from apps.orders.models import Order

from apps.orders.models import TelegramSubscriber


spec = importlib.util.spec_from_file_location(
    "review_telegram_bot", Path(__file__).resolve().parents[1] / "telegram-bot" / "main.py"
)
bot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bot)


class TelegramAuthorizationTests(TestCase):
    def setUp(self):
        self.subscriber = TelegramSubscriber.objects.create(username="manager", phone="+15551234567")
        self.env = patch.dict(os.environ, {"TELEGRAM_ENABLED": "true", "TELEGRAM_ALLOWED_USER_IDS": "123"})
        self.env.start()
        self.addCleanup(self.env.stop)
        self.transport = patch.object(bot, "api_request", side_effect=AssertionError("Network forbidden"))
        self.transport.start()
        self.addCleanup(self.transport.stop)
        for name in ("send_message", "send_message_kb"):
            mock = patch.object(bot, name, return_value=True)
            mock.start()
            self.addCleanup(mock.stop)

    def message(self, **changes):
        message = {"chat": {"id": 123, "type": "private"},
                   "from": {"id": 123, "username": "manager", "first_name": "Manager"},
                   "text": "/start"}
        message.update(changes)
        return message

    def assert_unlinked(self):
        self.subscriber.refresh_from_db()
        self.assertEqual(self.subscriber.chat_id, "")

    def test_groups_cannot_authorize_even_allowlisted_sender(self):
        bot.handle_message(self.message(chat={"id": -999, "type": "supergroup"}))
        self.assert_unlinked()

    def test_authorization_requires_explicit_immutable_id_approval(self):
        for allowlist in ("", "456", "manager", "1234", "123,invalid"):
            with self.subTest(allowlist=allowlist), patch.dict(os.environ, {"TELEGRAM_ALLOWED_USER_IDS": allowlist}):
                bot.handle_message(self.message())
                self.assert_unlinked()

    def test_bot_processing_is_disabled_by_default(self):
        with patch.dict(os.environ):
            os.environ.pop("TELEGRAM_ENABLED", None)
            bot.handle_message(self.message())
        self.assert_unlinked()

    def test_unapproved_own_contact_cannot_authorize_by_phone(self):
        with patch.dict(os.environ, {"TELEGRAM_ALLOWED_USER_IDS": "456"}):
            bot.handle_message(self.message(
                **{"from": {"id": 123}, "contact": {"phone_number": "+15551234567", "user_id": 123}}
            ))
        self.assert_unlinked()

    def test_sender_identity_must_match_private_chat(self):
        for sender in ({}, {"id": "123", "username": "manager"},
                       {"id": 456, "username": "manager"}, {"id": True, "username": "manager"}):
            with self.subTest(sender=sender):
                bot.handle_message(self.message(**{"from": sender}))
                self.assert_unlinked()

    def test_inactive_subscriber_stays_unlinked(self):
        self.subscriber.is_active = False
        self.subscriber.save()
        bot.handle_message(self.message())
        self.assert_unlinked()

    def test_unapproved_users_can_still_request_their_id(self):
        with patch.dict(os.environ, {"TELEGRAM_ALLOWED_USER_IDS": ""}):
            bot.handle_message(self.message(text="/my_id"))
        bot.send_message.assert_called_once()
        self.assertIn("123", bot.send_message.call_args.args[1])
        self.assert_unlinked()

    def test_approved_private_sender_can_start(self):
        bot.handle_message(self.message())
        self.subscriber.refresh_from_db()
        self.assertEqual(self.subscriber.chat_id, "123")

    def test_contacts_must_be_owned_by_sender(self):
        for owner in (None, 456, "123", True):
            with self.subTest(owner=owner):
                bot.handle_message(self.message(contact={"phone_number": "+15551234567", "user_id": owner}))
                self.assert_unlinked()

    def test_verified_own_contact_can_link_existing_phone_subscriber(self):
        bot.handle_message(self.message(
            **{"from": {"id": 123}, "contact": {"phone_number": "+15551234567", "user_id": 123}}
        ))
        self.subscriber.refresh_from_db()
        self.assertEqual(self.subscriber.chat_id, "123")


class AdminHtmlTests(SimpleTestCase):
    def setUp(self):
        self.inline = OrderItemInline(Order, AdminSite())
        self.admin = OrderAdmin(Order, AdminSite())

    def test_untrusted_urls_are_escaped_in_attributes_and_link_text(self):
        value = 'https://example.invalid/x?x=\"><svg/onload=alert(1)>&q=\"'
        image = str(self.inline.image_preview(SimpleNamespace(product_image_url=value)))
        link = str(self.admin.cart_link_clickable(SimpleNamespace(cart_link=value)))
        for rendered in (image, link):
            self.assertNotIn('<svg', rendered)
            self.assertIn('&quot;&gt;&lt;svg/onload=alert(1)&gt;&amp;q=&quot;', rendered)
        self.assertIn('rel="noopener noreferrer"', link)

    def test_dangerous_or_ambiguous_url_schemes_are_not_rendered(self):
        for url in ('javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<svg/onload=alert(1)>',
                    'vbscript:msgbox(1)', '//evil.invalid/a', '/\\evil.invalid/a',
                    '\\evil.invalid/a', 'java\nscript:alert(1)', '\tjavascript:alert(1)',
                    'https:///evil.invalid', 'https://[broken', 'ftp://example.invalid/a'):
            with self.subTest(url=url):
                self.assertEqual(self.inline.image_preview(SimpleNamespace(product_image_url=url)), 'No image')
                self.assertEqual(self.admin.cart_link_clickable(SimpleNamespace(cart_link=url)), 'No link')

    def test_safe_absolute_and_relative_urls_still_render(self):
        for url in ('https://example.invalid/a.png', 'http://example.invalid/cart', '/media/a.png',
                    'media/a.png', './cart?x=1&y=2', '../cart', '?cart=1', '#cart'):
            with self.subTest(url=url):
                self.assertIn('<img ', self.inline.image_preview(SimpleNamespace(product_image_url=url)))
                self.assertIn('<a ', self.admin.cart_link_clickable(SimpleNamespace(cart_link=url)))


