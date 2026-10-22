from django.contrib import admin
from django.utils.safestring import mark_safe
from adminsortable2.admin import SortableAdminMixin, SortableInlineAdminMixin
from .models import Section, Category, SectionCategory, Product, ProductExtraInfo, ProductOption
from .mixins import MakeFirstAdminMixin


class CategoryProductInline(SortableInlineAdminMixin, admin.TabularInline):
    model = Product
    extra = 0
    fields = [
        "order",
        "image_preview",
        "name",
        "price",
        "is_active",
        "is_featured",
    ]
    readonly_fields = ["image_preview"]
    ordering = ["order"]
    verbose_name = "Product in category"
    verbose_name_plural = "Products in this category (drag or use the arrows to reorder)"
    show_change_link = True

    def image_preview(self, obj):
        if obj and obj.pk:
            url = obj.effective_image_url
            if url:
                return mark_safe(
                    f'<img src="{url}" width="42" height="42" style="object-fit: cover; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);" />'
                )
        return "-"

    image_preview.short_description = "Photo"


class SectionCategoryInline(SortableInlineAdminMixin, admin.TabularInline):
    model = SectionCategory
    extra = 1
    fields = ["category", "order"]
    ordering = ["order"]
    verbose_name = "Category in section"
    verbose_name_plural = "Categories in this section (drag or use the arrows to reorder)"


class ProductExtraInfoInline(SortableInlineAdminMixin, admin.TabularInline):
    model = ProductExtraInfo
    extra = 1
    fields = ["amount", "unit", "is_active", "order"]
    ordering = ["order"]



class ProductOptionInline(SortableInlineAdminMixin, admin.TabularInline):
    model = ProductOption
    extra = 1
    fields = ["name", "price", "old_price", "min_order_quantity", "is_active", "order"]
    ordering = ["order"]



@admin.register(Section)
class SectionAdmin(SortableAdminMixin, MakeFirstAdminMixin, admin.ModelAdmin):
    list_display = ["order", "name", "slug", "get_categories_count", "image_preview", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    ordering = ["order"]
    list_editable = ["is_active"]
    readonly_fields = ["image_preview", "created_at"]
    inlines = [SectionCategoryInline]

    class Media:
        css = {
            "all": ["admin/css/sortable_custom.css", "admin/css/char_counter.css"]
        }
        js = [
            "admin/js/sortable_inline_arrows.js",
            "admin/js/slug_auto_update.js",
            "admin/js/char_counter.js",
        ]

    fieldsets = [
        (
            "General information",
            {
                "fields": ["name", "slug", "order", "is_active"],
            },
        ),
        (
            "SEO",
            {
                "fields": ["seo_title", "seo_description"],
                "description": (
                    "Search engine optimization for the catalog section.<br>"
                    "If left blank, tags are generated automatically from the section name and categories.<br>"
                    "Recommended title: 50-60 characters. Recommended description: 140-160 characters."
                ),
            },
        ),
        (
            "Section image",
            {
                "fields": ["image", "image_url", "image_preview"],
                "description": "Upload an image or enter an external URL.",
            },
        ),
        (
            "System information",
            {
                "fields": ["created_at"],
                "classes": ["collapse"],
            },
        ),
    ]

    def image_preview(self, obj):
        url = obj.effective_image_url
        if url:
            return mark_safe(f'<img src="{url}" width="100" style="border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />')
        return "No image"

    image_preview.short_description = "Preview"

    def get_categories_count(self, obj):
        return obj.categories.count()

    get_categories_count.short_description = "Categories in section"


@admin.register(Category)
class CategoryAdmin(SortableAdminMixin, MakeFirstAdminMixin, admin.ModelAdmin):
    list_display = ["order", "name", "get_sections", "get_products_count", "slug", "is_active"]
    list_filter = ["sections", "is_active"]
    search_fields = ["name", "slug"]
    ordering = ["order"]
    list_editable = ["is_active"]
    inlines = [CategoryProductInline]

    class Media:
        css = {
            "all": ["admin/css/sortable_custom.css", "admin/css/char_counter.css"]
        }
        js = [
            "admin/js/sortable_inline_arrows.js",
            "admin/js/slug_auto_update.js",
            "admin/js/char_counter.js",
        ]

    def get_sections(self, obj):
        sections = list(obj.sections.values_list("name", flat=True))
        return ", ".join(sections) if sections else "-"

    get_sections.short_description = "Sections"

    def get_products_count(self, obj):
        return obj.products.count()

    get_products_count.short_description = "Products"



@admin.register(Product)
class ProductAdmin(SortableAdminMixin, MakeFirstAdminMixin, admin.ModelAdmin):
    sortable_group_by = "category"
    list_display = [
        "order",
        "name",
        "slug",
        "category",
        "price",
        "image_preview",
        "is_active",
        "is_featured",
        "created_at",
    ]
    list_filter = ["category", "is_active", "is_featured"]
    search_fields = ["name", "slug", "description"]
    ordering = ["order"]
    list_editable = ["price", "is_active", "is_featured"]
    autocomplete_fields = ["category"]

    def get_extra_model_filters(self, request):
        filters = {}
        category_id = request.GET.get("category__id__exact")
        if category_id:
            filters["category_id"] = category_id
        return filters
    inlines = [ProductExtraInfoInline, ProductOptionInline]
    readonly_fields = ["image_preview", "created_at", "updated_at"]

    class Media:
        css = {
            "all": ["admin/css/sortable_custom.css", "admin/css/char_counter.css"]
        }
        js = [
            "admin/js/sortable_inline_arrows.js",
            "admin/js/slug_auto_update.js",
            "admin/js/char_counter.js",
        ]

    def image_preview(self, obj):
        url = obj.effective_image_url
        if url:
            return mark_safe(f'<img src="{url}" width="100" style="border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />')
        return "No image"

    image_preview.short_description = "Preview"
    fieldsets = [
        (
            "General information",
            {
                "fields": ["name", "slug", "category", "description", "order"],
            },
        ),
        (
            "Prices and limits",
            {
                "fields": ["price", "old_price", "min_order_quantity"],
            },
        ),
        (
            "Image",
            {
                "fields": ["image", "image_url", "image_preview"],
                "description": "Upload an image or enter an external URL.",
            },
        ),
        (
            "Status",
            {
                "fields": ["is_active", "is_featured"],
            },
        ),
        (
            "System information",
            {
                "fields": ["created_at", "updated_at"],
                "classes": ["collapse"],
            },
        ),
    ]
