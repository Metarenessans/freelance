import re
from django.db import models
from django.utils import timezone
from apps.catalog.models import slugify_ru


class BlogArticle(models.Model):
    title = models.CharField("Article title", max_length=255)
    slug = models.SlugField(
        "URL slug",
        max_length=255,
        unique=True,
        blank=True,
        help_text="Automatically generated from the title if left blank",
    )
    cover = models.ImageField("Cover", upload_to="blog/covers/", blank=True, null=True)
    is_cover_like_block_image = models.BooleanField(
        "Style the cover like an article block image", default=False
    )
    cover_alt = models.CharField("Cover alt text", max_length=255, blank=True, null=True)
    cover_source_link = models.CharField(
        "Cover source link", max_length=500, blank=True, null=True
    )
    created_date = models.DateField("Publication date", default=timezone.now)
    is_published = models.BooleanField("Published", default=True)
    seo_title = models.CharField("SEO Title", max_length=255, blank=True, null=True)
    seo_description = models.TextField("SEO Description", blank=True, null=True)
    created_at = models.DateTimeField("Created at", auto_now_add=True)
    updated_at = models.DateTimeField("Updated at", auto_now=True)

    class Meta:
        verbose_name = "Blog post"
        verbose_name_plural = "Blog posts"
        ordering = ["-created_date", "-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug and self.title:
            base_slug = slugify_ru(self.title) or "article"
            slug = base_slug
            counter = 1
            while BlogArticle.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class BlogArticleBlock(models.Model):
    article = models.ForeignKey(
        BlogArticle, on_delete=models.CASCADE, related_name="blocks", verbose_name="Article"
    )
    image = models.ImageField(
        "Article image", upload_to="blog/images/", blank=True, null=True
    )
    image_alt = models.CharField("Image alt text", max_length=255, blank=True, null=True)
    image_source_link = models.CharField(
        "Image source link", max_length=500, blank=True, null=True
    )
    image_height_unlimited = models.BooleanField("Do not limit height", default=False)
    text = models.TextField(
        "Block text",
        blank=True,
        help_text=(
            "Text formatting instructions:<br/>"
            "• <b>Block heading</b>: Enclose a line in single asterisks. Example: <code>*Introduction*</code><br/>"
            "• <b>Highlighted block (card)</b>: Enclose text in double asterisks. Example:<br/>"
            "<code>**This is important text<br/>on two lines**</code><br/>"
            "• <b>Bold text</b>: Enclose text in double underscores. Example: <code>__this is bold text__</code><br/>"
            "• <b>Links</b>: Use a standard HTML link tag. Example: <code>&lt;a href=\"https://...\" target=\"_blank\"&gt;Text&lt;/a&gt;</code><br/>"
            "• <b>Lists</b>: Start a line with '&gt;1. ', '&gt;2. ' and so on. Example:<br/>"
            "<code>&gt;1. First item<br/>&gt;2. Second item</code><br/>"
            "• <b>Plain text</b>: Use no special characters. Blank lines add paragraph spacing."
        ),
    )
    order = models.PositiveIntegerField("Order", default=0)

    class Meta:
        verbose_name = "Article block"
        verbose_name_plural = "Article blocks"
        ordering = ["order"]

    def __str__(self):
        if self.text:
            return f"Text: {self.text[:50]}..."
        if self.image:
            return f"Image: {self.image.name}"
        return f"Block #{self.order}"


class RelatedArticle(models.Model):
    article = models.ForeignKey(
        BlogArticle,
        on_delete=models.CASCADE,
        related_name="related_articles_association",
        verbose_name="Article",
    )
    related_article = models.ForeignKey(
        BlogArticle, on_delete=models.CASCADE, verbose_name="Related article"
    )
    order = models.PositiveIntegerField("Order", default=0)

    class Meta:
        verbose_name = "Related article"
        verbose_name_plural = "Related articles"
        ordering = ["order"]

    def __str__(self):
        return f"{self.article.title} -> {self.related_article.title}"


class ArticleProduct(models.Model):
    article = models.ForeignKey(
        BlogArticle,
        on_delete=models.CASCADE,
        related_name="article_products",
        verbose_name="Article",
    )
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.CASCADE, verbose_name="Related product / set"
    )
    order = models.PositiveIntegerField("Order", default=0)

    class Meta:
        verbose_name = "Product in the article"
        verbose_name_plural = "Products in the article"
        ordering = ["order"]

    def __str__(self):
        return f"{self.article.title} - {self.product.name}"
