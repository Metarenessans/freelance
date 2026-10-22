import os
from .portfolio import outbound_disabled
import logging
import threading
import time
import re
from django.core.mail import send_mail
from django.conf import settings
from .telegram import format_russian_date_and_days

logger = logging.getLogger(__name__)


def _clean_phone_number(phone):
    if not phone:
        return ""
    digits = "".join(re.findall(r'\d', phone))
    if len(digits) == 11 and digits.startswith('8'):
        digits = '7' + digits[1:]
    return digits


def _get_contact_links_html(phone):
    """Generate WhatsApp and Telegram links without calling Telethon."""
    clean_phone = _clean_phone_number(phone)
    if not clean_phone:
        return "—"
    wa_link = f'<a href="https://wa.me/{clean_phone}">WhatsApp</a>'
    tg_link = f'<a href="https://t.me/+{clean_phone}">Telegram (by phone number)</a>'
    return f"{wa_link}, {tg_link}"


def _get_admin_base_url():
    try:
        from apps.system_settings.models import SystemSettings
        return SystemSettings.load().get_site_url()
    except Exception:
        return os.getenv("ADMIN_BASE_URL", "https://catering-portfolio-api.vercel.app").rstrip("/")


def _send_to_email(subject, message, raise_exception=False):
    if (os.getenv("OUTBOUND_NOTIFICATIONS_DISABLED", "false").lower() == "true"
            or os.getenv("EMAIL_ENABLED", "false").lower() != "true"):
        return
    from .models import EmailSubscriber
    from apps.system_settings.models import SystemSettings
    from django.core.mail import get_connection

    sys_settings = SystemSettings.load()
    cfg = sys_settings.get_email_config()

    # Email configuration diagnostics
    email_host = cfg["host"]
    email_user = cfg["user"]
    if not email_host or not email_user:
        msg = (
            "Email notification skipped: EMAIL_HOST or EMAIL_HOST_USER is not configured in settings or .env. "
            "Configure the mail server and login in the new isolated environment."
        )
        logger.error(msg)
        if raise_exception:
            raise ValueError(msg)
        return

    try:
        active_subs = EmailSubscriber.objects.filter(is_active=True)
        recipient_list = [sub.email for sub in active_subs]
    except Exception as e:
        msg = f"Failed to read EmailSubscriber list from database: {e}"
        logger.error(msg)
        if raise_exception:
            raise Exception(msg) from e
        return

    if not recipient_list:
        msg = "No email addresses found for notifications (EmailSubscriber table is empty or all subscribers are inactive)."
        logger.warning(msg)
        if raise_exception:
            raise ValueError(msg)
        return

    logger.info(f"Sending email '{subject}' to configured recipients")

    # Convert \n to <br> for HTML email formatting
    html_message = message.replace('\n', '<br>')

    # Wrap in basic HTML structure
    html_message = f"""
    <html>
    <head>
    <style>
        body {{ font-family: sans-serif; line-height: 1.5; font-size: 14px; }}
        code {{ background-color: #f4f4f4; padding: 2px 4px; border-radius: 4px; }}
    </style>
    </head>
    <body>
    {html_message}
    </body>
    </html>
    """

    from_email = cfg["from_email"]

    try:
        connection = get_connection(
            host=cfg["host"],
            port=cfg["port"],
            username=cfg["user"],
            password=cfg["password"],
            use_ssl=cfg["use_ssl"],
            use_tls=cfg["use_tls"],
            fail_silently=False,
        )
        send_mail(
            subject=subject,
            message=message,  # Plain text fallback
            from_email=from_email,
            recipient_list=recipient_list,
            connection=connection,
            fail_silently=False,
            html_message=html_message
        )
        logger.info(f"Email '{subject}' sent successfully to configured recipients")
    except Exception as e:
        logger.error(f"Failed to send email notification to configured recipients: {type(e).__name__}", exc_info=False)
        if raise_exception:
            raise e


def _send_order_email_notification_bg(order_id):
    """Build and send an order email notification in the background."""
    try:
        # Allow the Django transaction to complete
        time.sleep(0.5)
        from .models import Order
        order = Order.objects.get(id=order_id)
        if outbound_disabled() or os.getenv("EMAIL_ENABLED", "false").lower() != "true":
            return

        name = order.name or "—"
        phone = order.phone or "—"
        contact_method = order.contact_method or "—"
        guests = order.guests or "—"
        event_date_str = format_russian_date_and_days(order.event_date)
        cart_link = order.cart_link or "—"

        admin_base_url = _get_admin_base_url()
        admin_link = f"{admin_base_url}/admin/orders/order/{order.id}/change/"

        total_price = f"{int(order.total_price)} ₽" if order.total_price is not None else "—"

        contact_links = _get_contact_links_html(phone)

        phone_formatted = f"<code>{phone}</code>" if phone != "—" else "—"
        guests_formatted = f"<code>{guests}</code>" if guests != "—" else "—"

        cart_line = f"Cart:\n{cart_link}" if cart_link != "—" else "Cart: —"
        admin_line = f'Request in admin: <a href="{admin_link}">open</a>'

        message = (
            f"<b>- Order -</b>\n\n"
            f"Name: {name}\n"
            f"Phone: {phone_formatted}\n"
            f"Contact method: {contact_method}\n"
            f"Number of guests: {guests_formatted}\n"
            f"Event date: {event_date_str}\n"
            f"{cart_line}\n"
            f"{admin_line}\n"
            f"Total: {total_price}\n\n"
            f"Additional information:\n"
            f"{contact_links}"
        )

        _send_to_email("New order", message)
    except Exception as e:
        logger.error(f"Error in background order email notification for ID {order_id}: {type(e).__name__}", exc_info=False)


def _send_menu_request_email_notification_bg(menu_request_id):
    """Build and send a menu selection email notification in the background."""
    try:
        # Allow the Django transaction to complete
        time.sleep(0.5)
        from ..menu_requests.models import MenuRequest
        menu_request = MenuRequest.objects.get(id=menu_request_id)
        if outbound_disabled() or os.getenv("EMAIL_ENABLED", "false").lower() != "true":
            return

        name = menu_request.name or "—"
        phone = menu_request.phone or "—"
        contact_method = menu_request.contact_method or "—"
        guests = menu_request.guests or "—"
        event_date_str = format_russian_date_and_days(menu_request.date)
        event_format = menu_request.format or "—"

        # Food preferences
        food_prefs = menu_request.food_preferences or []
        if food_prefs:
            food_prefs_lines = [f"— {pref}" for pref in food_prefs]
            food_prefs_str = "\n" + "\n".join(food_prefs_lines)
        else:
            food_prefs_str = " —"

        admin_base_url = _get_admin_base_url()

        # Additional services (look up by ID)
        services_str = "—"
        service_ids = menu_request.additional_services or []
        if service_ids:
            try:
                from ..menu_requests.models import AdditionalService
                int_ids = []
                for sid in service_ids:
                    try:
                        int_ids.append(int(sid))
                    except ValueError:
                        pass
                if int_ids:
                    services = AdditionalService.objects.filter(id__in=int_ids).select_related('linked_product')
                    if services.exists():
                        service_lines = []
                        for s in services:
                            if s.linked_product:
                                prod_url = f"{admin_base_url}/admin/catalog/product/{s.linked_product.id}/change/"
                                service_lines.append(f'— {s.label} (<a href="{prod_url}">linked product</a>)')
                            else:
                                service_lines.append(f"— {s.label}")
                        services_str = "\n" + "\n".join(service_lines)
            except Exception as e:
                logger.error(f"Error fetching additional services for email notification: {type(e).__name__}")

        admin_link = f"{admin_base_url}/admin/menu_requests/menurequest/{menu_request.id}/change/"

        contact_links = _get_contact_links_html(phone)

        phone_formatted = f"<code>{phone}</code>" if phone != "—" else "—"
        guests_formatted = f"<code>{guests}</code>" if guests != "—" else "—"

        admin_line = f'Request in admin: <a href="{admin_link}">open</a>'

        message = (
            f"<b>- Menu request -</b>\n\n"
            f"Name: {name}\n"
            f"Phone: {phone_formatted}\n"
            f"Contact method: {contact_method}\n"
            f"Event format: {event_format}\n"
            f"Number of guests: {guests_formatted}\n"
            f"Event date: {event_date_str}\n"
            f"Food preferences: {food_prefs_str}\n"
            f"Additional services: {services_str}\n\n"
            f"{admin_line}\n\n"
            f"Additional information:\n"
            f"{contact_links}"
        )

        _send_to_email("New menu selection request", message)
    except Exception as e:
        logger.error(f"Error in background menu request email notification for ID {menu_request_id}: {type(e).__name__}", exc_info=False)


def send_order_email_notification(order):
    """Sends email notification about a new order asynchronously."""
    if outbound_disabled() or os.getenv("EMAIL_ENABLED", "false").lower() != "true":
        return
    threading.Thread(
        target=_send_order_email_notification_bg,
        args=(order.id,),
        daemon=True
    ).start()


def send_menu_request_email_notification(menu_request):
    """Sends email notification about a new menu request asynchronously."""
    if outbound_disabled() or os.getenv("EMAIL_ENABLED", "false").lower() != "true":
        return
    threading.Thread(
        target=_send_menu_request_email_notification_bg,
        args=(menu_request.id,),
        daemon=True
    ).start()


def send_order_email_notification_sync(order_id, raise_exception=True):
    """Build and send an order email notification synchronously."""
    from .models import Order
    order = Order.objects.get(id=order_id)
    if outbound_disabled() or os.getenv("EMAIL_ENABLED", "false").lower() != "true":
        return

    name = order.name or "—"
    phone = order.phone or "—"
    contact_method = order.contact_method or "—"
    guests = order.guests or "—"
    event_date_str = format_russian_date_and_days(order.event_date)
    cart_link = order.cart_link or "—"

    admin_base_url = _get_admin_base_url()
    admin_link = f"{admin_base_url}/admin/orders/order/{order.id}/change/"

    total_price = f"{int(order.total_price)} ₽" if order.total_price is not None else "—"

    contact_links = _get_contact_links_html(phone)

    phone_formatted = f"<code>{phone}</code>" if phone != "—" else "—"
    guests_formatted = f"<code>{guests}</code>" if guests != "—" else "—"

    cart_line = f"Cart:\n{cart_link}" if cart_link != "—" else "Cart: —"
    admin_line = f'Request in admin: <a href="{admin_link}">open</a>'

    message = (
        f"<b>- Order -</b>\n\n"
        f"Name: {name}\n"
        f"Phone: {phone_formatted}\n"
        f"Contact method: {contact_method}\n"
        f"Number of guests: {guests_formatted}\n"
        f"Event date: {event_date_str}\n"
        f"{cart_line}\n"
        f"{admin_line}\n"
        f"Total: {total_price}\n\n"
        f"Additional information:\n"
        f"{contact_links}"
    )

    _send_to_email("New order", message, raise_exception=raise_exception)


def send_menu_request_email_notification_sync(menu_request_id, raise_exception=True):
    """Build and send a menu selection email notification synchronously."""
    from ..menu_requests.models import MenuRequest
    menu_request = MenuRequest.objects.get(id=menu_request_id)
    if outbound_disabled() or os.getenv("EMAIL_ENABLED", "false").lower() != "true":
        return

    name = menu_request.name or "—"
    phone = menu_request.phone or "—"
    contact_method = menu_request.contact_method or "—"
    guests = menu_request.guests or "—"
    event_date_str = format_russian_date_and_days(menu_request.date)
    event_format = menu_request.format or "—"

    # Food preferences
    food_prefs = menu_request.food_preferences or []
    if food_prefs:
        food_prefs_lines = [f"— {pref}" for pref in food_prefs]
        food_prefs_str = "\n" + "\n".join(food_prefs_lines)
    else:
        food_prefs_str = " —"

    admin_base_url = _get_admin_base_url()

    # Additional services (look up by ID)
    services_str = "—"
    service_ids = menu_request.additional_services or []
    if service_ids:
        try:
            from ..menu_requests.models import AdditionalService
            int_ids = []
            for sid in service_ids:
                try:
                    int_ids.append(int(sid))
                except ValueError:
                    pass
            if int_ids:
                services = AdditionalService.objects.filter(id__in=int_ids).select_related('linked_product')
                if services.exists():
                    service_lines = []
                    for s in services:
                        if s.linked_product:
                            prod_url = f"{admin_base_url}/admin/catalog/product/{s.linked_product.id}/change/"
                            service_lines.append(f'— {s.label} (<a href="{prod_url}">linked product</a>)')
                        else:
                            service_lines.append(f"— {s.label}")
                    services_str = "\n" + "\n".join(service_lines)
        except Exception as e:
            logger.error(f"Error fetching additional services for email notification: {type(e).__name__}")

    admin_link = f"{admin_base_url}/admin/menu_requests/menurequest/{menu_request.id}/change/"

    contact_links = _get_contact_links_html(phone)

    phone_formatted = f"<code>{phone}</code>" if phone != "—" else "—"
    guests_formatted = f"<code>{guests}</code>" if guests != "—" else "—"

    admin_line = f'Request in admin: <a href="{admin_link}">open</a>'

    budget = menu_request.budget or "—"
    budget_line = f"Estimated budget: {budget}\n" if budget != "—" else ""

    message = (
        f"<b>- Menu request -</b>\n\n"
        f"Name: {name}\n"
        f"Phone: {phone_formatted}\n"
        f"Contact method: {contact_method}\n"
        f"Event format: {event_format}\n"
        f"Number of guests: {guests_formatted}\n"
        f"{budget_line}"
        f"Event date: {event_date_str}\n"
        f"Food preferences: {food_prefs_str}\n"
        f"Additional services: {services_str}\n\n"
        f"{admin_line}\n\n"
        f"Additional information:\n"
        f"{contact_links}"
    )

    _send_to_email("New menu selection request", message, raise_exception=raise_exception)
