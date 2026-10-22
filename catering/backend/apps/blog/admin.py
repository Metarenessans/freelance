from django.contrib import admin
from adminsortable2.admin import (
    SortableAdminBase,
    SortableStackedInline,
    SortableTabularInline,
)
from .models import BlogArticle, BlogArticleBlock, RelatedArticle, ArticleProduct


class BlogArticleBlockInline(SortableStackedInline):
    model = BlogArticleBlock
    extra = 0
    fields = (
        "order",
        "text",
        "image",
        "image_height_unlimited",
        "image_alt",
        "image_source_link",
    )


class RelatedArticleInline(SortableTabularInline):
    model = RelatedArticle
    extra = 1
    fk_name = "article"
    fields = ("order", "related_article")
    verbose_name = "Related article"
    verbose_name_plural = "Related articles"


class ArticleProductInline(SortableTabularInline):
    model = ArticleProduct
    extra = 1
    fk_name = "article"
    fields = ("order", "product")
    verbose_name = "Product / set from article"
    verbose_name_plural = "Products / sets from article"
    autocomplete_fields = ("product",)


@admin.register(BlogArticle)
class BlogArticleAdmin(SortableAdminBase, admin.ModelAdmin):
    class Media:
        css = {
            "all": ["admin/css/char_counter.css"]
        }
        js = [
            "admin/js/char_counter.js"
        ]
    list_display = ("title", "slug", "created_date", "is_published", "created_at")
    list_filter = ("is_published", "created_date")
    search_fields = ("title", "slug")
    prepopulated_fields = {"slug": ("title",)}
    inlines = (BlogArticleBlockInline, RelatedArticleInline, ArticleProductInline)
    fieldsets = (
        (
            "General information",
            {
                "fields": (
                    "title",
                    "slug",
                    "created_date",
                    "is_published",
                    "cover",
                    "is_cover_like_block_image",
                    "cover_alt",
                    "cover_source_link",
                ),
            },
        ),
        (
            "SEO settings",
            {
                "fields": ("seo_title", "seo_description"),
            },
        ),
    )
