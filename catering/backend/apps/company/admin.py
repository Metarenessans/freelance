from django.contrib import admin, messages
from django.utils.safestring import mark_safe
from adminsortable2.admin import SortableAdminMixin
from .models import CompanyInfo, LegalDocument, PrivacyPolicy
from ..catalog.mixins import MakeFirstAdminMixin


@admin.register(CompanyInfo)
class CompanyInfoAdmin(admin.ModelAdmin):
    list_display = ["company_name", "phone_number", "email", "updated_at"]
    readonly_fields = [
        "updated_at",
        "hero_image_top_preview",
        "hero_image_top_mobile_preview",
        "hero_image_bottom_preview",
        "og_image_preview",
    ]

    fieldsets = [
        (
            "General information and legal details",
            {
                "fields": [
                    "company_name",
                    "legal_name",
                    "city",
                    "address",
                    "inn",
                    "ogrn",
                ],
            },
        ),
        (
            "Schema.org structured data / Geolocation (SEO)",
            {
                "fields": [
                    "latitude",
                    "longitude",
                    "price_range",
                    "serves_cuisine",
                ],
                "description": "Fields for search engine structured data (Yandex / Google). If left blank, they are omitted from Schema.org.",
            },
        ),
        (
            "Contacts and links",
            {
                "fields": [
                    "phone_number",
                    "email",
                    "telegram",
                    "max_messenger",
                    "vk",
                    "reviews_url",
                    "rkn_registry_url",
                    "rkn_registry_number",
                ],
            },
        ),
        (
            "Finance and delivery",
            {
                "fields": ["min_order_amount", "free_delivery_threshold", "delivery_cost"],
            },
        ),
        (
            "Hero section images",
            {
                "fields": [
                    "hero_image_top",
                    "hero_image_top_preview",
                    "hero_image_top_mobile",
                    "hero_image_top_mobile_preview",
                    "hero_image_bottom",
                    "hero_image_bottom_preview",
                ],
            },
        ),
        (
            "Social media and messenger image (Open Graph)",
            {
                "fields": [
                    "og_image",
                    "og_image_preview",
                ],
                "description": (
                    "<b>Main Open Graph image (og:image)</b> for generating an attractive link preview "
                    "in Telegram, VK, WhatsApp and search engine snippets.<br>"
                    "A landscape image with an aspect ratio of <b>1.91:1 (1200×630 px)</b> is recommended.<br>"
                    "<i>Displayed on all website pages except product pages and individual blog posts.</i>"
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

    def hero_image_top_preview(self, obj):
        if obj.hero_image_top:
            return mark_safe(f'<img src="{obj.hero_image_top.url}" width="150" style="border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />')
        return "No image"
    hero_image_top_preview.short_description = "Top image preview"

    def hero_image_top_mobile_preview(self, obj):
        if obj.hero_image_top_mobile:
            return mark_safe(f'<img src="{obj.hero_image_top_mobile.url}" width="150" style="border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />')
        return "No image"
    hero_image_top_mobile_preview.short_description = "Mobile top image preview"

    def hero_image_bottom_preview(self, obj):
        if obj.hero_image_bottom:
            return mark_safe(f'<img src="{obj.hero_image_bottom.url}" width="150" style="border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />')
        return "No image"
    hero_image_bottom_preview.short_description = "Bottom image preview"

    def og_image_preview(self, obj):
        if obj.og_image:
            return mark_safe(f'<img src="{obj.og_image.url}" width="240" style="border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.1);" />')
        return "No image"
    og_image_preview.short_description = "Preview OG Image"

    def has_add_permission(self, request):
        """Allow creation only when no record exists."""
        return not CompanyInfo.objects.exists()

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of the singleton record."""
        return False


@admin.register(LegalDocument)
class LegalDocumentAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "has_file", "updated_at", "view_on_site_link"]
    list_display_links = ["title"]
    readonly_fields = ["updated_at", "html_preview", "live_page_link"]
    search_fields = ["title", "slug"]

    fieldsets = [
        (
            "General information",
            {
                "fields": ["title", "slug", "live_page_link"],
            },
        ),
        (
            "Document upload (automatic HTML conversion)",
            {
                "fields": ["file"],
                "description": (
                    "<b>Upload a document file</b> (.docx, .pdf, .md, .html, .txt).<br>"
                    "When saved, the file is automatically converted to semantic HTML "
                    "and inserted into the field below.<br>"
                    "<i>Microsoft Word (.docx) is recommended for the best heading and list markup.</i>"
                ),
            },
        ),
        (
            "HTML content",
            {
                "fields": ["content_html"],
                "description": (
                    "Generated document HTML. You can also edit it directly "
                    "or paste your own code."
                ),
            },
        ),
        (
            "Visual preview",
            {
                "fields": ["html_preview"],
            },
        ),
        (
            "System information",
            {
                "fields": ["order", "updated_at"],
            },
        ),
    ]

    def has_file(self, obj):
        return bool(obj.file)
    has_file.boolean = True
    has_file.short_description = "File uploaded"

    def html_preview(self, obj):
        if not obj.content_html:
            return mark_safe("<em>HTML content is currently empty. Upload a file above or enter HTML.</em>")
        return mark_safe(
            '<div style="max-height: 450px; overflow-y: auto; padding: 20px; '
            'background: #181818; color: #f0f0f0; border: 1px solid #333; '
            'border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; '
            'line-height: 1.7; font-size: 14px;">'
            f'{obj.content_html}'
            '</div>'
        )
    html_preview.short_description = "Visual preview"

    def live_page_link(self, obj):
        if not obj.slug:
            return "-"
        from apps.system_settings.models import SystemSettings
        frontend_url = SystemSettings.load().get_frontend_url()
        return mark_safe(
            f'<a href="{frontend_url}/{obj.slug}" target="_blank" '
            f'style="display: inline-block; padding: 6px 14px; background: #db4900; '
            f'color: #fff; text-decoration: none; border-radius: 4px; font-weight: 500;">'
            f'Open on website (/{obj.slug}) ↗'
            f'</a>'
        )
    live_page_link.short_description = "View on website"

    def view_on_site_link(self, obj):
        if not obj.slug:
            return "-"
        from apps.system_settings.models import SystemSettings
        frontend_url = SystemSettings.load().get_frontend_url()
        return mark_safe(
            f'<a href="{frontend_url}/{obj.slug}" target="_blank" style="color: #db4900; font-weight: 500;">'
            f'On website ↗</a>'
        )
    view_on_site_link.short_description = "Link"

    def save_model(self, request, obj, form, change):
        if "file" in form.changed_data and form.cleaned_data.get("file"):
            uploaded_file = form.cleaned_data["file"]
            try:
                from .doc_converter import convert_document_to_html
                converted_html = convert_document_to_html(uploaded_file)
                if converted_html:
                    obj.content_html = converted_html
                    messages.success(
                        request,
                        f"File «{uploaded_file.name}» successfully converted to HTML!"
                    )
                else:
                    messages.warning(
                        request,
                        f"File «{uploaded_file.name}» processed, but its content is empty."
                    )
            except Exception as e:
                messages.error(
                    request,
                    f"Error converting file «{uploaded_file.name}»: {e}"
                )
        super().save_model(request, obj, form, change)







