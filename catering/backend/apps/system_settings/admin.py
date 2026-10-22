from django.contrib import admin
from django.utils.safestring import mark_safe
from django.urls import path, reverse
from django.http import HttpResponseRedirect
from django.contrib import messages
from django.core.mail import get_connection, send_mail
from .models import SystemSettings, SeoSettings
from apps.catalog.revalidate import notify_frontend_revalidate


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ["__str__", "frontend_url", "email_host_user", "updated_at"]
    readonly_fields = ["cache_actions_display", "email_test_display", "updated_at"]

    fieldsets = [
        (
            "Site connection (Next.js) and cache invalidation",
            {
                "fields": [
                    "frontend_url",
                    "revalidation_secret",
                    "site_url",
                    "cache_actions_display",
                ],
                "description": (
                    "Settings for invalidating structured data and page caches after changes in the admin.<br>"
                    "<b>Frontend URL:</b> <code>http://127.0.0.1:3000</code> locally or <code>https://example.com</code> in production.<br>"
                    "<b>Primary site URL:</b> used in links in customer emails and Telegram notifications."
                ),
            },
        ),
        (
            "Sending email (SMTP)",
            {
                "fields": [
                    "email_host",
                    "email_port",
                    "email_use_ssl",
                    "email_use_tls",
                    "email_host_user",
                    "email_host_password",
                    "default_from_email",
                    "email_test_display",
                ],
                "description": (
                    "Mailbox settings for order and menu selection notifications.<br>"
                    "Empty fields automatically fall back to values from <code>.env</code>.<br>"
                    "For Yandex Mail, use <b>host:</b> <code>smtp.yandex.ru</code>, <b>port:</b> <code>465</code>, <b>SSL:</b> enabled, "
                    "and a dedicated <b>app password</b> from your Yandex ID account."
                ),
            },
        ),
        (
            "Telegram integration",
            {
                "fields": ["telegram_bot_token", "telegram_bot_proxy"],
                "description": (
                    "Telegram bot settings for sending notifications to administrators.<br>"
                    "<b>Bot token:</b> created through <code>@BotFather</code> (falls back to <code>.env</code> if not specified).<br>"
                    "<b>Proxy:</b> supported formats are <code>socks5://user:pass@host:port</code>, <code>http://user:pass@host:port</code>, or <code>host:port:user:pass</code>."
                ),
            },
        ),
        (
            "SEO and sitemap",
            {
                "fields": ["sitemap_cache_minutes", "enable_debug_json_file"],
                "description": (
                    "Control the cache lifetime for <code>/sitemap.xml</code>.<br>"
                    "<b>0</b> - generate on demand (force-dynamic): each request fetches fresh data.<br>"
                    "<b>> 0</b> (e.g. 30 or 60) - cache for the specified number of minutes for maximum speed."
                ),
            },
        ),
        (
            "System information",
            {
                "fields": ["updated_at"],
            },
        ),
    ]

    def cache_actions_display(self, obj):
        url = reverse("admin:system_settings_revalidate_cache")
        return mark_safe(
            f'''
            <div style="margin-top: 5px;">
                <a href="{url}" class="button" style="background-color: #264b5d; color: white; padding: 6px 14px; text-decoration: none; border-radius: 4px; font-weight: 500;">
                    🔄 Clear the entire site cache (Next.js) now
                </a>
                <span style="margin-left: 10px; color: #666; font-size: 13px;">Sends a request to {obj.get_frontend_url()}</span>
            </div>
            '''
        )
    cache_actions_display.short_description = "Action"

    def email_test_display(self, obj):
        url = reverse("admin:system_settings_send_test_email")
        return mark_safe(
            f'''
            <div style="margin-top: 5px;">
                <a href="{url}" class="button" style="background-color: #28a745; color: white; padding: 6px 14px; text-decoration: none; border-radius: 4px; font-weight: 500;">
                    ✉️ Send a test email
                </a>
                <span style="margin-left: 10px; color: #666; font-size: 13px;">Tests the SMTP connection and email delivery</span>
            </div>
            '''
        )
    email_test_display.short_description = "Email testing"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "revalidate-cache/",
                self.admin_site.admin_view(self.revalidate_cache_view),
                name="system_settings_revalidate_cache",
            ),
            path(
                "send-test-email/",
                self.admin_site.admin_view(self.send_test_email_view),
                name="system_settings_send_test_email",
            ),
        ]
        return custom_urls + urls

    def revalidate_cache_view(self, request):
        obj = SystemSettings.load()
        try:
            notify_frontend_revalidate(event_type="all")
            messages.success(
                request,
                f"Cache invalidation request sent to the frontend ({obj.get_frontend_url()})!"
            )
        except Exception as e:
            messages.error(request, f"Error sending webhook: {e}")

        return HttpResponseRedirect(
            reverse("admin:system_settings_systemsettings_change", args=[obj.pk])
        )

    def send_test_email_view(self, request):
        import os
        if os.getenv("EMAIL_ENABLED", "false").lower() != "true":
            self.message_user(request, "Email is disabled in this environment.", level=messages.WARNING)
            return HttpResponseRedirect(reverse("admin:system_settings_systemsettings_changelist"))
        obj = SystemSettings.load()
        cfg = obj.get_email_config()

        if not cfg["host"] or not cfg["user"]:
            messages.error(
                request,
                "The SMTP server or email / username is not configured in either the admin or .env!"
            )
            return HttpResponseRedirect(
                reverse("admin:system_settings_systemsettings_change", args=[obj.pk])
            )

        recipient = request.user.email or cfg["user"]
        try:
            conn = get_connection(
                host=cfg["host"],
                port=cfg["port"],
                username=cfg["user"],
                password=cfg["password"],
                use_ssl=cfg["use_ssl"],
                use_tls=cfg["use_tls"],
                fail_silently=False,
            )
            message_body = (
                "This is a test email to check the site SMTP settings.\n\n"
                "Sent from Django Admin.\n"
                f"Host: {cfg['host']}:{cfg['port']}\n"
                f"Sender: {cfg['from_email']}\n"
                f"Recipient: {recipient}\n"
            )
            send_mail(
                subject="Test message | Demo Catering",
                message=message_body,
                from_email=cfg["from_email"],
                recipient_list=[recipient],
                connection=conn,
                fail_silently=False,
            )
            messages.success(
                request,
                f"Test email sent to {recipient} through {cfg['host']}:{cfg['port']}!"
            )
        except Exception as e:
            messages.error(
                request,
                f"Error sending through {cfg['host']}:{cfg['port']}: {e}"
            )

        return HttpResponseRedirect(
            reverse("admin:system_settings_systemsettings_change", args=[obj.pk])
        )

    def changelist_view(self, request, extra_context=None):
        """Redirect directly to the singleton edit form."""
        obj = SystemSettings.load()
        return HttpResponseRedirect(
            reverse("admin:system_settings_systemsettings_change", args=[obj.pk])
        )

    def has_add_permission(self, request):
        return not SystemSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SeoSettings)
class SeoSettingsAdmin(admin.ModelAdmin):
    readonly_fields = ["updated_at"]

    class Media:
        css = {
            "all": ["admin/css/char_counter.css"]
        }
        js = [
            "admin/js/char_counter.js"
        ]

    fieldsets = [
        (
            "Home page (/)",
            {
                "fields": ["home_title", "home_description"],
                "description": (
                    "Configure the title and description meta tags for the home page.<br>"
                    "Optimal title: 50-60 characters. Optimal description: 140-160 characters."
                ),
            },
        ),
        (
            "Blog page (/blog)",
            {
                "fields": ["blog_title", "blog_description"],
                "description": (
                    "Configure the title and description meta tags for the blog article listing at <code>/blog</code>.<br>"
                    "For individual articles, set the title and description in each blog article."
                ),
            },
        ),
        (
            "System information",
            {
                "fields": ["updated_at"],
                "classes": ["collapse"],
            },
        ),
    ]

    def changelist_view(self, request, extra_context=None):
        """Always open the edit form for the single record directly."""
        obj = SeoSettings.load()
        return HttpResponseRedirect(
            reverse("admin:system_settings_seosettings_change", args=[obj.pk])
        )

    def has_add_permission(self, request):
        return not SeoSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        notify_frontend_revalidate(event_type="seo")
