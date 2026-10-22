"""
URL configuration for catering_backend project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from apps.system_settings.views import SeoSettingsView

# Hide the unused token blacklist section from the admin interface.
try:
    from rest_framework_simplejwt.token_blacklist.models import (
        OutstandingToken,
        BlacklistedToken,
    )

    admin.site.unregister(OutstandingToken)
    admin.site.unregister(BlacklistedToken)
except Exception:
    pass


@api_view(["GET"])
def api_v1_root(request, format=None):
    """
    Master API v1 Directory for the Catering Service Platform.
    Provides direct links to all endpoints and interactive Swagger / OpenAPI documentation.
    """
    return Response({
        "swagger_docs": reverse("swagger-ui", request=request, format=format),
        "redoc": reverse("redoc", request=request, format=format),
        "openapi_schema": reverse("schema", request=request, format=format),
        "catalog": {
            "products": reverse("product-list", request=request, format=format),
            "sections": reverse("section-list", request=request, format=format),
            "categories": reverse("category-list", request=request, format=format),
        },
        "orders": reverse("order-list", request=request, format=format),
        "menu_requests": {
            "inquiries": reverse("menu-request-list", request=request, format=format),
            "formats": reverse("event-format-list", request=request, format=format),
            "services": reverse("additional-service-list", request=request, format=format),
            "calculate_settings": reverse("calculate-settings", request=request, format=format),
        },
        "company": {
            "info": reverse("company-info", request=request, format=format),
            "documents": reverse("legal-documents", request=request, format=format),
            "privacy_policy": reverse("privacy-policy", request=request, format=format),
        },
        "faq": reverse("faq-list", request=request, format=format),
        "blog": reverse("blog:article-list", request=request, format=format),
        "seo_settings": reverse("seo_settings", request=request, format=format),
        "auth": {
            "token_obtain": reverse("token_obtain_pair", request=request, format=format),
            "token_refresh": reverse("token_refresh", request=request, format=format),
            "token_verify": reverse("token_verify", request=request, format=format),
        },
    })


urlpatterns = [
    # Quick redirects to Swagger documentation
    path("", RedirectView.as_view(url="/api/docs/", permanent=False)),
    path("api/", RedirectView.as_view(url="/api/docs/", permanent=False)),
    path("api/v1/", api_v1_root, name="api-root"),

    # Admin
    path("admin/", admin.site.urls),

    # Interactive OpenAPI / Swagger / Redoc Documentation (Always Available)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-alt"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # API v1 Modules
    path("api/v1/catalog/", include("apps.catalog.urls")),
    path("api/v1/orders/", include("apps.orders.urls")),
    path("api/v1/menu-requests/", include("apps.menu_requests.urls")),
    path("api/v1/faq/", include("apps.faq.urls")),
    path("api/v1/company/", include("apps.company.urls")),
    path("api/v1/system-settings/", include("apps.system_settings.urls")),
    path("api/v1/seo-settings/", SeoSettingsView.as_view(), name="seo_settings"),
    path("api/v1/blog/", include("apps.blog.urls")),

    # JWT Auth
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
