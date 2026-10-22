import os
from django.db import models
from django.conf import settings


class SystemSettings(models.Model):
    """
    Global singleton system settings for the service.
    """
    # 1. SEO and sitemap
    sitemap_cache_minutes = models.PositiveIntegerField(
        default=0,
        verbose_name="Sitemap cache duration (minutes)",
        help_text="0 - generate on demand (force-dynamic). A value > 0 (e.g. 30 or 60) caches the sitemap for the specified number of minutes.",
    )
    enable_debug_json_file = models.BooleanField(
        default=False,
        verbose_name="Generate a JSON file for structured data debugging",
        help_text="When enabled, creates and updates schema_markup_debug.json in the project root as pages are visited. Disabled by default to avoid unnecessary disk activity.",
    )

    # 2. Frontend connection (Next.js Revalidation Webhook)
    frontend_url = models.CharField(
        max_length=255,
        default="",
        blank=True,
        verbose_name="Frontend URL (Next.js)",
        help_text="Frontend URL for cache invalidation webhooks (local: http://127.0.0.1:3000, production: https://example.com).",
    )
    revalidation_secret = models.CharField(
        max_length=255,
        default="",
        blank=True,
        verbose_name="Webhook secret key",
        help_text="Secret token for authorizing Next.js cache invalidation requests (REVALIDATION_SECRET).",
    )
    site_url = models.CharField(
        max_length=255,
        default="",
        blank=True,
        verbose_name="Primary site URL",
        help_text="Used to build site and admin links in notifications.",
    )

    # 3. Sending email (SMTP)
    email_host = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="SMTP server (host)",
        help_text="Example: smtp.yandex.ru. Falls back to .env if blank.",
    )
    email_port = models.PositiveIntegerField(
        default=465,
        verbose_name="SMTP port",
        help_text="Usually 465 for SSL or 587 for TLS.",
    )
    email_use_ssl = models.BooleanField(
        default=True,
        verbose_name="Use SSL",
    )
    email_use_tls = models.BooleanField(
        default=False,
        verbose_name="Use TLS",
    )
    email_host_user = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="SMTP email / username",
        help_text="Sending mailbox (e.g. notifications@example.com). Falls back to .env if blank.",
    )
    email_host_password = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="SMTP app password",
        help_text="Email app password (e.g. created in Yandex ID). Falls back to .env if blank.",
    )
    default_from_email = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Sender email (From)",
        help_text="Displayed sender address. If blank, uses the SMTP email / username.",
    )

    # 4. Telegram integration
    telegram_bot_token = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Telegram bot token",
        help_text="Bot token from @BotFather (e.g. :ABCdefGHI...). Falls back to .env if blank.",
    )
    telegram_bot_proxy = models.CharField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Telegram bot proxy",
        help_text="Proxy URL or string (e.g. socks5://user:pass@host:port, http://user:pass@host:port, or host:port:user:pass).",
    )

    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    class Meta:
        verbose_name = "System settings"
        verbose_name_plural = "System settings"

    def __str__(self):
        return "System settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def get_frontend_url(self) -> str:
        url = self.frontend_url or getattr(settings, "FRONTEND_URL", "http://127.0.0.1:3000")
        return url.rstrip("/")

    def get_revalidation_secret(self) -> str:
        return self.revalidation_secret or getattr(settings, "REVALIDATION_SECRET", "")

    def get_site_url(self) -> str:
        url = self.site_url or os.getenv("ADMIN_BASE_URL", "https://example.com")
        return url.rstrip("/")

    def get_telegram_bot_token(self) -> str:
        return self.telegram_bot_token or os.getenv("TELEGRAM_BOT_TOKEN", "")

    def get_email_config(self) -> dict:
        host = self.email_host or getattr(settings, "EMAIL_HOST", "") or os.getenv("EMAIL_HOST", "")
        port = self.email_port or getattr(settings, "EMAIL_PORT", 465)
        user = self.email_host_user or getattr(settings, "EMAIL_HOST_USER", "") or os.getenv("EMAIL_HOST_USER", "")
        password = self.email_host_password or getattr(settings, "EMAIL_HOST_PASSWORD", "") or os.getenv("EMAIL_HOST_PASSWORD", "")
        use_ssl = self.email_use_ssl if self.email_host else getattr(settings, "EMAIL_USE_SSL", True)
        use_tls = self.email_use_tls if self.email_host else getattr(settings, "EMAIL_USE_TLS", False)
        from_email = self.default_from_email or os.getenv("DEFAULT_FROM_EMAIL", getattr(settings, "DEFAULT_FROM_EMAIL", user))
        return {
            "host": host,
            "port": int(port),
            "user": user,
            "password": password,
            "use_ssl": use_ssl,
            "use_tls": use_tls,
            "from_email": from_email,
        }


class SeoSettings(models.Model):
    """
    Global singleton SEO settings for static and key site pages.
    """
    # Home page (/)
    home_title = models.CharField(
        max_length=255,
        blank=True,
        default="Demo Catering | Buffet and catering delivery in your area",
        verbose_name="Home page title (/)",
        help_text="Home page browser title (50-60 characters recommended). If blank, the system template is used.",
    )
    home_description = models.TextField(
        blank=True,
        default="Order catering, banquet and buffet dishes delivered in your area. Enjoy appetizers, bruschetta, canapés and ready-made sets for any celebration from Demo Catering.",
        verbose_name="Home page description (/)",
        help_text="Home page meta description for search engines (140-160 characters recommended).",
    )

    # Blog page (/blog)
    blog_title = models.CharField(
        max_length=255,
        blank=True,
        default="Catering and buffet blog - articles and tips | Demo Catering",
        verbose_name="Blog page title (/blog)",
        help_text="Title of the blog article listing page (50-60 characters recommended).",
    )
    blog_description = models.TextField(
        blank=True,
        default="Chef tips on buffet quantities, table settings, food boxes and catering for celebrations in your area. Read the Demo Catering blog!",
        verbose_name="Blog page description (/blog)",
        help_text="Blog page meta description for search engines (140-160 characters recommended).",
    )

    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    class Meta:
        verbose_name = "SEO settings"
        verbose_name_plural = "SEO settings"

    def __str__(self):
        return "SEO settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
