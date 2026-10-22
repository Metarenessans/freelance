"""
Django settings for catering_backend project.
"""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    raise ImproperlyConfigured("Set SECRET_KEY to a newly generated deployment-specific value.")

DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# ─── Applications ────────────────────────────────────────────────────────────

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "adminsortable2",
    # Local apps
    "apps.catalog",
    "apps.orders",
    "apps.menu_requests",
    "apps.faq",
    "apps.company",
    "apps.system_settings",
    "apps.blog",
]

# ─── Middleware ───────────────────────────────────────────────────────────────

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "catering_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "catering_backend.wsgi.application"

# ─── Database ─────────────────────────────────────────────────────────────────

# SQLite is an explicit offline/local-test option, never an automatic production fallback.
if os.getenv("DB_ENGINE", "postgresql") == "sqlite":
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": os.getenv("SQLITE_PATH", str(BASE_DIR / "db.sqlite3"))}}
else:
    DATABASES = {"default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "catering_demo"),
        "USER": os.getenv("DB_USER", "catering_demo"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
        "CONN_MAX_AGE": 60,
        "OPTIONS": {"sslmode": os.getenv("DB_SSLMODE", "prefer")},
    }}

# ─── Password validation ──────────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ─── Internationalization ─────────────────────────────────────────────────────

LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True

# ─── Static & Media files ────────────────────────────────────────────────────

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Read-only marketing media is bundled as a CDN snapshot for the demo.
# This is not persistent upload storage; customer submissions remain disabled.
STATICFILES_DIRS = [("demo-media", MEDIA_ROOT)] if os.getenv("PUBLISH_DEMO_MEDIA", "false").lower() == "true" else []

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── CORS ────────────────────────────────────────────────────────────────────

CORS_ALLOW_ALL_ORIGINS = DEBUG  # Allow all origins only in local development.

CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", 
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
).split(",")
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_PRIVATE_NETWORK = True

# ─── Django REST Framework ────────────────────────────────────────────────────

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# ─── SimpleJWT ───────────────────────────────────────────────────────────────

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ─── DRF Spectacular (Swagger) ───────────────────────────────────────────────

SPECTACULAR_SETTINGS = {
    "TITLE": "Demo Catering - Catering API",
    "DESCRIPTION": (
        "REST API for the Demo Catering application.\n\n"
        "Provides access to products, categories, orders, menu-planning requests, "
        "FAQs and company information."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# ─── Email Settings ───────────────────────────────────────────────────────────

def _clean_email_var(val):
    if not val:
        return ""
    if "=" in val:
        parts = val.split("=", 1)
        if parts[0].strip() in ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_HOST_USER", "EMAIL_HOST_PASSWORD", "DEFAULT_FROM_EMAIL", "EMAIL_USE_SSL", "EMAIL_USE_TLS"]:
            return parts[1].strip()
    return val.strip()

EMAIL_BACKEND = "django.core.mail.backends.dummy.EmailBackend"
EMAIL_HOST = _clean_email_var(os.getenv("EMAIL_HOST")) or ""
EMAIL_PORT = int(_clean_email_var(os.getenv("EMAIL_PORT")) or 465)
EMAIL_USE_SSL = (_clean_email_var(os.getenv("EMAIL_USE_SSL")) or "True") == "True"
EMAIL_USE_TLS = (_clean_email_var(os.getenv("EMAIL_USE_TLS")) or "False") == "True"
EMAIL_HOST_USER = _clean_email_var(os.getenv("EMAIL_HOST_USER")) or ""
EMAIL_HOST_PASSWORD = _clean_email_var(os.getenv("EMAIL_HOST_PASSWORD")) or ""
DEFAULT_FROM_EMAIL = _clean_email_var(os.getenv("DEFAULT_FROM_EMAIL")) or EMAIL_HOST_USER

# ─── Frontend Revalidation (Next.js Cache Webhook) ───────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000")
REVALIDATION_SECRET = os.getenv("REVALIDATION_SECRET", "")

# Explicit opt-in is required by each outbound integration.
CSRF_TRUSTED_ORIGINS = [value.strip() for value in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",") if value.strip()]
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "false").lower() == "true"
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0"))
if os.getenv("TRUST_PROXY_SSL", "false").lower() == "true":
    # Enable only behind a provider that overwrites the forwarded-protocol header.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
