"""
Telegram bot for catering order notifications.
Architecture: long polling with optional SOCKS5 proxy and exponential backoff.
"""

import os
import re
import sys
import time
import logging
import signal

import requests
from dotenv import load_dotenv

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

# ── Load local environment ──────────────────────────────────────────────────────────────
_script_dir = os.path.dirname(os.path.abspath(__file__))
_env_candidates = [
    os.path.join(_script_dir, ".env"),
]
for _p in _env_candidates:
    if os.path.exists(_p):
        load_dotenv(_p)
        log.info("Loaded local environment file: %s", _p)
        break

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

API_BASE = f"https://api.telegram.org/bot{TOKEN}"

# ── Django ORM database connection ────────────────────────────────────
django_available = False
TelegramSubscriber = None

try:
    _backend_dir = os.path.join(_script_dir, "../backend")
    if _backend_dir not in sys.path:
        sys.path.insert(0, _backend_dir)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "catering_backend.settings")
    import django
    django.setup()
    from apps.orders.models import TelegramSubscriber  # type: ignore
    from apps.system_settings.utils import get_telegram_proxy_config  # type: ignore
    django_available = True
    log.info("Django ORM connected.")
except Exception as exc:
    log.warning("Django ORM unavailable: %s", type(exc).__name__)


def get_active_proxies() -> dict | None:
    """
    Read the current requests proxy configuration from SystemSettings.
    Return None when no proxy is configured; requests then connect directly.
    """
    if django_available:
        try:
            from apps.system_settings.utils import get_telegram_proxy_config
            cfg = get_telegram_proxy_config()
            if cfg and cfg.get("requests_proxies"):
                return cfg["requests_proxies"]
        except Exception as exc:
            log.warning("Cannot read proxy configuration: %s", type(exc).__name__)

    return None


# ── Stop signal handling ─────────────────────────────────────────
_stop = False

def _handle_signal(sig, frame):
    global _stop
    log.info("Received signal %s; stopping...", sig)
    _stop = True

signal.signal(signal.SIGTERM, _handle_signal)
signal.signal(signal.SIGINT, _handle_signal)

# ── Helpers ────────────────────────────────────────────────────

def clean_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]
    return digits


def api_request(method: str, payload: dict | None = None, timeout: int = 40) -> dict | None:
    if os.getenv("TELEGRAM_ENABLED", "false").lower() != "true":
        return None
    """
    Single entry point for Telegram API requests.
    Return the response dictionary or None on failure.
    """
    url = f"{API_BASE}/{method}"
    proxies = get_active_proxies()
    try:
        if payload:
            resp = requests.post(url, json=payload, proxies=proxies, timeout=timeout)
        else:
            resp = requests.get(url, proxies=proxies, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.HTTPError as exc:
        log.warning("HTTP error [%s]: %s", method, type(exc).__name__)
    except requests.exceptions.Timeout:
        log.warning("Timeout [%s]", method)
    except requests.exceptions.ConnectionError as exc:
        log.warning("Connection error [%s]: %s", method, type(exc).__name__)
    except Exception as exc:
        log.error("Unexpected error [%s]: %s", method, type(exc).__name__)
    return None


def get_updates(offset: int | None, long_poll_timeout: int = 30) -> list:
    if os.getenv("TELEGRAM_ENABLED", "false").lower() != "true":
        return []
    url = f"{API_BASE}/getUpdates"
    params: dict = {"timeout": long_poll_timeout, "allowed_updates": ["message"]}
    if offset is not None:
        params["offset"] = offset
    proxies = get_active_proxies()
    try:
        resp = requests.get(url, params=params, proxies=proxies, timeout=long_poll_timeout + 10)
        resp.raise_for_status()
        return resp.json().get("result", [])
    except requests.exceptions.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else 0
        if status == 429:
            retry_after = int(exc.response.headers.get("Retry-After", 30))
            log.warning("429 Too Many Requests — waiting %d seconds.", retry_after)
            time.sleep(retry_after)
        else:
            log.warning("HTTP %d during getUpdates: %s", status, type(exc).__name__)
        return []
    except requests.exceptions.Timeout:
        # Expected long-poll timeout; retry
        return []
    except requests.exceptions.ConnectionError as exc:
        log.warning("Connection error during getUpdates: %s", type(exc).__name__)
        return []
    except Exception as exc:
        log.error("getUpdates — unexpected error: %s", type(exc).__name__)
        return []


def send_message(chat_id: int | str, text: str) -> bool:
    result = api_request("sendMessage", {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
    }, timeout=10)
    return result is not None and result.get("ok", False)


def send_message_kb(chat_id: int | str, text: str, keyboard: dict) -> bool:
    result = api_request("sendMessage", {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "reply_markup": keyboard,
    }, timeout=10)
    return result is not None and result.get("ok", False)

# ── Subscriber authorization ───────────────────────────────────────────

def find_subscriber(username: str | None, phone: str | None = None):
    """Find an active subscriber by username or phone; return the record or None."""
    if not django_available or TelegramSubscriber is None:
        raise RuntimeError("Django ORM unavailable")

    subscriber = None

    if username:
        clean = username.lstrip("@").strip()
        subscriber = (
            TelegramSubscriber.objects.filter(username__iexact=clean, is_active=True).first()
            or TelegramSubscriber.objects.filter(username__iexact=f"@{clean}", is_active=True).first()
        )

    if not subscriber and phone:
        target = clean_phone(phone)
        for sub in TelegramSubscriber.objects.filter(is_active=True).exclude(phone=""):
            if clean_phone(sub.phone) == target:
                subscriber = sub
                break

    return subscriber


def authorize_user(chat_id: int | str, username: str | None, phone: str | None = None):
    """Authorize the user and save chat_id; return the subscriber or None."""
    sub = find_subscriber(username, phone)
    if sub:
        sub.chat_id = str(chat_id)
        sub.save()
    return sub

# ── Command and message handlers ────────────────────────────────────────────

def handle_start(chat_id, username: str, user_name: str):
    display = username.lstrip("@") if username else ""
    send_message(chat_id, (
        f"👋 Hello, {user_name}!\n\n"
        f"I provide notifications for new catering orders and menu requests.\n\n"
        f"Checking your Telegram username "
        f"(<code>@{display or 'not set'}</code>)..."
    ))

    try:
        sub = authorize_user(chat_id, username)
        if sub:
            send_message(chat_id,
                f"✅ <b>Authorization successful!</b>\n"
                f"You are subscribed as: <code>{sub}</code>."
            )
        else:
            send_message_kb(chat_id, (
                f"ℹ️ <b>Username @{display or 'not set'} is not on the allowlist.</b>\n\n"
                f"To authorize by phone, press the button below:"
            ), {
                "keyboard": [[{"text": "📱 Share phone number", "request_contact": True}]],
                "resize_keyboard": True,
                "one_time_keyboard": True,
            })
    except Exception as exc:
        log.error("Authorization error during /start: %s", type(exc).__name__)
        send_message(chat_id, "⚠️ Cannot connect to the database. Contact the administrator.")


def handle_contact(chat_id, username: str, phone: str):
    send_message(chat_id, "⏳ Checking phone authorization...")
    try:
        sub = authorize_user(chat_id, username, phone)
        if sub:
            send_message_kb(chat_id, (
                f"✅ <b>Authorization successful!</b>\n\n"
                f"Chat ID linked to subscriber: <code>{sub}</code>.\n"
                f"You will now receive new order notifications."
            ), {"remove_keyboard": True})
        else:
            send_message_kb(chat_id, (
                f"❌ <b>Access denied</b>\n\n"
                f"This phone number is not on the subscriber allowlist.\n"
                f"Contact the administrator."
            ), {"remove_keyboard": True})
    except Exception as exc:
        log.error("Phone authorization error: %s", type(exc).__name__)
        send_message_kb(chat_id, "⚠️ The database is temporarily unavailable. Try again later.", {"remove_keyboard": True})


def handle_my_id(chat_id, username: str):
    display = username.lstrip("@") if username else ""
    send_message(chat_id, f"Your Chat ID: <code>{chat_id}</code>\nYour username: <code>@{display or 'not set'}</code>")


def handle_unsubscribe(chat_id):
    if not django_available or TelegramSubscriber is None:
        send_message(chat_id, "⚠️ Database unavailable.")
        return
    try:
        subs = TelegramSubscriber.objects.filter(chat_id=str(chat_id))
        if subs.exists():
            subs.update(chat_id="")
            send_message(chat_id, "❌ You have unsubscribed. Chat ID cleared.")
        else:
            send_message(chat_id, "ℹ️ You were not subscribed.")
    except Exception as exc:
        log.error("Error during /unsubscribe: %s", type(exc).__name__)
        send_message(chat_id, "⚠️ Database error while unsubscribing.")


def handle_status(chat_id):
    if not django_available or TelegramSubscriber is None:
        send_message(chat_id, "⚠️ Database unavailable.")
        return
    try:
        subs = TelegramSubscriber.objects.filter(chat_id=str(chat_id), is_active=True)
        if subs.exists():
            send_message(chat_id, f"📊 <b>Status:</b> Subscribed and authorized ✅ (as {subs.first()})")
        else:
            send_message(chat_id, "📊 <b>Status:</b> Not subscribed or not authorized ❌")
    except Exception as exc:
        log.error("Error during /status: %s", type(exc).__name__)
        send_message(chat_id, "⚠️ Cannot read subscription status from the database.")


def handle_help(chat_id):
    send_message(chat_id, (
        "📖 <b>Command reference:</b>\n\n"
        "/start — Authorize and subscribe to notifications\n"
        "/unsubscribe — Unsubscribe from notifications\n"
        "/status — Check subscription status\n"
        "/my_id — Show your Telegram Chat ID\n"
        "/help — Show this help"
    ))


def handle_message(message: dict):
    if os.getenv("TELEGRAM_ENABLED", "false").lower() != "true":
        return
    chat = message.get("chat", {})
    chat_id = chat.get("id")
    if not chat_id or chat.get("type") != "private":
        return

    from_user = message.get("from", {})
    user_id = from_user.get("id")
    # Telegram user IDs, unlike usernames/phones, are immutable approval keys.
    allowed = [value.strip() for value in os.getenv("TELEGRAM_ALLOWED_USER_IDS", "").split(",")]
    if type(user_id) is not int or user_id <= 0 or chat_id != user_id:
        return
    approved = (all(re.fullmatch(r"[1-9][0-9]*", value) for value in allowed)
                and str(user_id) in allowed)
    username = from_user.get("username", "") or ""
    user_name = from_user.get("first_name", "User")
    text = (message.get("text") or "").strip()

    # Contact phone number
    contact = message.get("contact")
    if contact:
        if not approved or type(contact.get("user_id")) is not int or contact["user_id"] != user_id:
            return
        handle_contact(chat_id, username, contact.get("phone_number", ""))
        return

    # Commands
    # Support bot mentions, such as /start@botname
    cmd = text.split("@")[0].lower() if text.startswith("/") else text

    if cmd == "/start":
        if not approved:
            send_message(chat_id, "❌ Access denied. Ask the administrator to approve your Telegram user ID.")
            return
        handle_start(chat_id, username, user_name)
    elif cmd == "/my_id":
        handle_my_id(chat_id, username)
    elif cmd in ("/subscribe",):
        send_message(chat_id, "ℹ️ Send /start to authorize")
    elif cmd == "/unsubscribe":
        handle_unsubscribe(chat_id)
    elif cmd == "/status":
        handle_status(chat_id)
    elif cmd == "/help":
        handle_help(chat_id)

# ── Startup connection check ────────────────────────────────────────────

def check_connection() -> bool:
    proxies = get_active_proxies()
    proxy_display = "configured" if proxies else "disabled"
    log.info("Checking Telegram API connection; proxy: %s...", proxy_display)
    result = api_request("getMe", timeout=15)
    if result and result.get("ok"):
        bot_info = result.get("result", {})
        log.info("Bot connected: @%s (id=%s)", bot_info.get("username"), bot_info.get("id"))
        return True
    log.error("Cannot connect to Telegram API. Check the proxy and token.")
    return False

# ── Main long-polling loop ─────────────────────────────────────────────────

def main():
    if os.getenv("TELEGRAM_ENABLED", "false").lower() != "true":
        log.info("Telegram is disabled. Set TELEGRAM_ENABLED=true only after configuring a dedicated test bot.")
        return
    if not TOKEN or TOKEN in ("", "AAH_change_me"):
        log.error("TELEGRAM_BOT_TOKEN is not configured. Set it in the local environment and restart.")
        sys.exit(1)

    # Retry the initial connection
    connected = False
    for attempt in range(1, 6):
        if check_connection():
            connected = True
            break
        wait = min(30, 5 * attempt)
        log.warning("Attempt %d/5 failed. Waiting %d seconds...", attempt, wait)
        time.sleep(wait)

    if not connected:
        log.error("Connection failed after five attempts. Exiting.")
        sys.exit(1)

    log.info("Bot started. Waiting for updates...")

    offset: int | None = None
    error_streak = 0          # Consecutive error count
    MAX_BACKOFF = 60          # Maximum error delay in seconds

    while not _stop:
        updates = get_updates(offset)

        if updates is None or (isinstance(updates, list) and len(updates) == 0 and offset is None):
            # An empty initial response may indicate a network issue
            error_streak = max(0, error_streak - 1)  # Gradually reduce the error count
            continue

        if not isinstance(updates, list):
            error_streak += 1
            wait = min(MAX_BACKOFF, 2 ** error_streak)
            log.warning("Invalid API response. Waiting %d seconds...", wait)
            time.sleep(wait)
            continue

        # Reset the error count after a successful response
        error_streak = 0

        for update in updates:
            try:
                update_id = update.get("update_id")
                if update_id is not None:
                    offset = update_id + 1

                if "message" in update:
                    handle_message(update["message"])
            except Exception as exc:
                log.error("Error processing update %s: %s", update.get("update_id"), type(exc).__name__)

    log.info("Bot stopped cleanly.")


if __name__ == "__main__":
    main()
