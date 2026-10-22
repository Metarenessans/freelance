import re
from django.db import models


def slugify_ru(text: str) -> str:
    """Transliterate Cyrillic into a Latin-character slug."""
    if not text:
        return ""
    ru_map = {
        "\u0430": "a", "\u0431": "b", "\u0432": "v", "\u0433": "g", "\u0434": "d", "\u0435": "e", "\u0451": "yo", "\u0436": "zh",
        "\u0437": "z", "\u0438": "i", "\u0439": "y", "\u043a": "k", "\u043b": "l", "\u043c": "m", "\u043d": "n", "\u043e": "o",
        "\u043f": "p", "\u0440": "r", "\u0441": "s", "\u0442": "t", "\u0443": "u", "\u0444": "f", "\u0445": "kh", "\u0446": "ts",
        "\u0447": "ch", "\u0448": "sh", "\u0449": "shch", "\u044a": "", "\u044b": "y", "\u044c": "", "\u044d": "e", "\u044e": "yu",
        "\u044f": "ya",
    }
    transliterated = "".join(ru_map.get(char, char) for char in text.lower())
    cleaned = re.sub(r"[^a-z0-9]+", "-", transliterated)
    return cleaned.strip("-")


class Section(models.Model):
    """
    Catalog section (for example: Buffet, Banquet, Kids menu).
    Contains categories through a ManyToMany relationship.
    """
    slug = models.SlugField(
        max_length=100,
        unique=True,
        blank=True,
        verbose_name="Identifier (slug)",
        help_text="Used as a section filter (for example: furshet, banquet). Generated from the name if left blank.",
    )
    name = models.CharField(max_length=200, verbose_name="Name")
    categories = models.ManyToManyField(
        "Category",
        through="SectionCategory",
        blank=True,
        related_name="sections",
        verbose_name="Categories",
        help_text="Select the categories included in this section",
    )
    image_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Image URL (external)",
    )
    image = models.ImageField(
        upload_to="sections/",
        null=True,
        blank=True,
        verbose_name="Uploaded image",
    )
    order = models.PositiveIntegerField(default=0, verbose_name="Sort order")
    is_active = models.BooleanField(default=True, verbose_name="Active")
    seo_title = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="SEO title (Title)",
        help_text="Leave blank to generate automatically (for example: Buffet dishes and appetizers - order delivery in your area)",
    )
    seo_description = models.TextField(
        blank=True,
        default="",
        verbose_name="SEO Description (Description)",
        help_text="Leave blank to generate automatically using a formula listing the section categories",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")

    class Meta:
        verbose_name = "Section"
        verbose_name_plural = "Sections"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug and self.name:
            base_slug = slugify_ru(self.name) or "section"
            slug = base_slug
            counter = 1
            while Section.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def effective_image_url(self):
        """Return the image URL, preferring the uploaded image over the external URL."""
        if self.image:
            url = self.image.url
            from django.conf import settings
            import os
            try:
                if settings.DEBUG and not os.path.exists(self.image.path):
                    return url
            except ValueError:
                pass
            return url
        return self.image_url


class Category(models.Model):
    """
    Product category.
    Matches categoriesData in frontend/src/mock-data.ts.
    """
    slug = models.SlugField(
        max_length=100,
        unique=True,
        blank=True,
        verbose_name="Identifier (slug)",
        help_text="Used as a catalog filter (for example: profitable, desserts). Generated from the name if left blank.",
    )
    name = models.CharField(max_length=200, verbose_name="Name")
    order = models.PositiveIntegerField(default=0, verbose_name="Sort order")
    is_active = models.BooleanField(default=True, verbose_name="Active")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug and self.name:
            base_slug = slugify_ru(self.name) or "category"
            slug = base_slug
            counter = 1
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class SectionCategory(models.Model):
    """
    Intermediate model for the Section - Category relationship.
    Allows category display order to be configured separately for each section.
    """
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name="section_categories",
        verbose_name="Section",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="category_sections",
        verbose_name="Category",
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Sort order",
        db_index=True,
    )

    class Meta:
        verbose_name = "Section category"
        verbose_name_plural = "Section categories"
        ordering = ["order", "id"]
        unique_together = [("section", "category")]

    def __str__(self):
        return f"{self.section.name} - {self.category.name}"


class ProductExtraInfo(models.Model):
    """
    Additional product information (quantity/weight).
    Matches extraInfo: { amount: number; unit: string }[] in the frontend.
    """
    product = models.ForeignKey(
        "Product",
        on_delete=models.CASCADE,
        related_name="extra_info",
        verbose_name="Product",
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Quantity/weight",
    )
    unit = models.CharField(max_length=50, verbose_name="Unit of measure")
    is_active = models.BooleanField(default=True, verbose_name="Active")
    order = models.PositiveIntegerField(default=0, verbose_name="Order")

    class Meta:
        verbose_name = "Additional information"
        verbose_name_plural = "Additional information"
        ordering = ["order"]

    def __str__(self):
        return f"{self.amount} {self.unit}"


class Product(models.Model):
    """
    Catalog product (dish/set).
    Matches the Product interface in frontend/src/mock-data.ts.
    """
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
        verbose_name="Category",
    )
    slug = models.SlugField(
        max_length=300,
        unique=True,
        blank=True,
        null=True,
        verbose_name="Identifier (slug)",
        help_text="Used in the product detail URL. Generated from the name if left blank.",
    )
    name = models.CharField(max_length=300, verbose_name="Name")
    image_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Image URL (external)",
    )
    image = models.ImageField(
        upload_to="products/",
        null=True,
        blank=True,
        verbose_name="Uploaded image",
    )
    description = models.TextField(blank=True, default="", verbose_name="Description")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Price (₽)",
    )
    old_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Previous price (₽)",
        help_text="Fill in to display a crossed-out price",
    )
    is_active = models.BooleanField(default=True, verbose_name="Active")
    is_featured = models.BooleanField(
        default=False,
        verbose_name="Featured",
        help_text="Displayed in the 'Special offers' section",
    )
    order = models.PositiveIntegerField(default=0, verbose_name="Sort order")
    min_order_quantity = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Minimum order quantity",
        help_text="Minimum product quantity per order. No limit if left blank.",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug and self.name:
            base_slug = slugify_ru(self.name)[:280] or "product"
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def effective_image_url(self):
        """Return the image URL, preferring the uploaded image over the external URL."""
        if self.image:
            url = self.image.url
            from django.conf import settings
            import os
            try:
                if settings.DEBUG and not os.path.exists(self.image.path):
                    return url
            except ValueError:
                pass
            return url
        return self.image_url


class ProductOption(models.Model):
    """
    Price/content option for a product (for example, 10, 20, 30, or 50 people).
    """
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="options",
        verbose_name="Product",
    )
    name = models.CharField(max_length=200, verbose_name="Option name")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Option price (₽)",
    )
    old_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Previous option price (₽)",
    )
    min_order_quantity = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Minimum order quantity",
        help_text="Minimum quantity per order for this option. Uses the product limit if left blank.",
    )
    is_active = models.BooleanField(default=True, verbose_name="Active")
    order = models.PositiveIntegerField(default=0, verbose_name="Order")

    class Meta:
        verbose_name = "Product option"
        verbose_name_plural = "Product options"
        ordering = ["order"]

    def __str__(self):
        return f"{self.product.name} - {self.name} ({self.price} ₽)"
