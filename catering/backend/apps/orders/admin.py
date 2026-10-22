from urllib.parse import urlsplit

from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.http import HttpResponseRedirect
from django.contrib import messages
from .models import Order, OrderItem, TelegramSubscriber, EmailSubscriber
from .portfolio import outbound_disabled
from .telegram import send_order_telegram_notification


def is_safe_display_url(url):
    """Allow HTTP(S) URLs or unambiguous relative URLs, never active schemes."""
    if not url or url != url.strip() or "\\" in url or any(ord(char) < 32 or ord(char) == 127 for char in url):
        return False
    try:
        parsed = urlsplit(url)
        if parsed.scheme:
            return parsed.scheme.lower() in {"http", "https"} and bool(parsed.hostname)
        return not parsed.netloc and not url.startswith("//")
    except ValueError:
        return False


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["image_preview", "product", "option", "option_name", "product_name", "product_image_url", "price", "quantity", "subtotal"]
    can_delete = False

    def image_preview(self, obj):
        url = obj.product_image_url
        if is_safe_display_url(url):
            return format_html(
                '<img src="{}" width="100" style="border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />', url
            )
        return "No image"

    image_preview.short_description = "Preview"

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "is_demo",
        "status",
        "name",
        "phone",
        "guests",
        "event_date",
        "total_price",
        "delivery_cost",
        "final_price",
        "items_count",
        "created_at",
    ]
    list_filter = ["status", "is_demo", "created_at"]
    search_fields = ["id", "comment"]
    ordering = ["-created_at"]
    readonly_fields = ["is_demo", "total_price", "delivery_cost", "final_price", "cart_link_clickable", "send_telegram_button", "created_at", "updated_at"]
    fields = [
        "is_demo",
        "status",
        "name",
        "phone",
        "contact_method",
        "guests",
        "event_date",
        "total_price",
        "delivery_cost",
        "final_price",
        "comment",
        "cart_link_clickable",
        "send_telegram_button",
        "created_at",
        "updated_at",
    ]
    list_editable = ["status"]
    inlines = [OrderItemInline]

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<path:object_id>/send-telegram/',
                self.admin_site.admin_view(self.send_telegram_view),
                name='order-send-telegram',
            ),
            path(
                '<path:object_id>/send-email/',
                self.admin_site.admin_view(self.send_email_view),
                name='order-send-email',
            ),
        ]
        return custom_urls + urls

    def send_telegram_view(self, request, object_id):
        obj = self.get_object(request, object_id)
        if obj:
            try:
                send_order_telegram_notification(obj)
                self.message_user(request, "Telegram notification sent successfully!", messages.SUCCESS)
            except Exception as e:
                self.message_user(request, f"Error sending: {e}", messages.ERROR)
        return HttpResponseRedirect("../change/")

    def send_email_view(self, request, object_id):
        obj = self.get_object(request, object_id)
        if obj:
            try:
                from .email import send_order_email_notification_sync
                send_order_email_notification_sync(obj.id, raise_exception=True)
                self.message_user(request, "Email notification sent successfully!", messages.SUCCESS)
            except Exception as e:
                self.message_user(request, f"Error sending: {e}", messages.ERROR)
        return HttpResponseRedirect("../change/")

    @admin.display(description="Send notifications")
    def send_telegram_button(self, obj):
        if outbound_disabled():
            return "Notifications disabled."
        if obj and obj.pk:
            tg_url = reverse('admin:order-send-telegram', args=[obj.pk])
            email_url = reverse('admin:order-send-email', args=[obj.pk])
            return format_html(
                '<a class="button" href="{}" style="background-color: #007bff; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; text-decoration: none; display: inline-block; margin-right: 10px;">'
                'Send to Telegram'
                '</a>'
                '<a class="button" href="{}" style="background-color: #28a745; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; text-decoration: none; display: inline-block;">'
                'Send by email'
                '</a>', tg_url, email_url
            )
        return "Save the object first"

    @admin.display(description="Items")
    def items_count(self, obj):
        return obj.items.count()

    @admin.display(description="Cart link")
    def cart_link_clickable(self, obj):
        if is_safe_display_url(obj.cart_link):
            return format_html(
                '<a href="{}" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline; word-break: break-all;">'
                '{}</a>', obj.cart_link, obj.cart_link
            )
        return "No link"


@admin.register(TelegramSubscriber)
class TelegramSubscriberAdmin(admin.ModelAdmin):
    list_display = ["username", "phone", "chat_id", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["username", "phone", "chat_id"]
    list_editable = ["is_active"]
    readonly_fields = ["chat_id", "created_at", "updated_at"]
    fields = ["username", "phone", "chat_id", "is_active", "created_at", "updated_at"]

@admin.register(EmailSubscriber)
class EmailSubscriberAdmin(admin.ModelAdmin):
    list_display = ["email", "name", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["email", "name"]
    list_editable = ["is_active"]
    readonly_fields = ["created_at", "updated_at"]
    fields = ["email", "name", "is_active", "created_at", "updated_at"]

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "check-smtp/",
                self.admin_site.admin_view(self.check_smtp_view),
                name="emailsubscriber-check-smtp",
            ),
        ]
        return custom_urls + urls

    def check_smtp_view(self, request):
        import os
        from django.shortcuts import render
        from django.core.mail import send_mail
        from django.conf import settings
        import traceback

        # Get settings values (with masking of host password)
        email_host = getattr(settings, 'EMAIL_HOST', None) or os.getenv('EMAIL_HOST')
        email_port = getattr(settings, 'EMAIL_PORT', None) or os.getenv('EMAIL_PORT')
        email_use_ssl = getattr(settings, 'EMAIL_USE_SSL', None)
        email_use_tls = getattr(settings, 'EMAIL_USE_TLS', None)
        email_host_user = getattr(settings, 'EMAIL_HOST_USER', None) or os.getenv('EMAIL_HOST_USER')
        email_host_password = getattr(settings, 'EMAIL_HOST_PASSWORD', None) or os.getenv('EMAIL_HOST_PASSWORD')
        default_from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or os.getenv('DEFAULT_FROM_EMAIL')

        masked_password = "Configured (hidden)" if email_host_password else "Not configured"

        settings_info = {
            "EMAIL_HOST": email_host or "— (Empty)",
            "EMAIL_PORT": str(email_port) if email_port is not None else "— (Empty)",
            "EMAIL_USE_SSL": str(email_use_ssl),
            "EMAIL_USE_TLS": str(email_use_tls),
            "EMAIL_HOST_USER": email_host_user or "— (Empty)",
            "EMAIL_HOST_PASSWORD": masked_password,
            "DEFAULT_FROM_EMAIL": default_from_email or "— (Empty)",
        }

        # Check active subscribers in database
        active_subs = list(self.model.objects.filter(is_active=True))
        subscribers_info = {
            "count": len(active_subs),
            "emails": [sub.email for sub in active_subs],
        }

        test_status = None
        test_error = None
        test_email = request.POST.get("test_email") if request.method == "POST" else None

        if request.method == "POST" and test_email and os.getenv("EMAIL_ENABLED", "false").lower() == "true":
            try:
                from_email = default_from_email or email_host_user
                send_mail(
                    subject="ChefMil SMTP test message",
                    message="If you received this email, your SMTP settings are configured and working correctly!",
                    from_email=from_email,
                    recipient_list=[test_email],
                    fail_silently=False,
                    html_message="<h2>SMTP connection test</h2><p>If you received this email, your SMTP settings are configured and working correctly!</p>"
                )
                test_status = "success"
            except Exception:
                test_status = "error"
                test_error = traceback.format_exc()

        context = {
            **self.admin_site.each_context(request),
            "title": "SMTP diagnostics and testing",
            "settings_info": settings_info,
            "subscribers_info": subscribers_info,
            "test_email": test_email or request.user.email or "",
            "test_status": test_status,
            "test_error": test_error,
        }

        return render(request, "admin/orders/emailsubscriber/check_smtp.html", context)
