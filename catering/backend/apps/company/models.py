from django.db import models
from ..catalog.models import Category


class CompanyInfo(models.Model):
    """
    Company information: a single record (singleton).
    Matches the CompanyInfo interface in frontend/src/mock-data.ts.
    """
    company_name = models.CharField(max_length=200, verbose_name="Company name")
    legal_name = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Legal name",
        help_text="Official legal entity (for example, a sole proprietor or limited liability company). If blank, the company name is used in the markup.",
    )
    city = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="City",
        help_text="City for Schema.org PostalAddress (addressLocality)",
    )
    address = models.CharField(max_length=500, verbose_name="Address")
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Latitude (latitude)",
        help_text="Geographic latitude for maps and Schema.org (for example: 0.000000). If not provided, the geo block is omitted.",
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Longitude (longitude)",
        help_text="Geographic longitude for maps and Schema.org (for example: 0.000000). If not provided, the geo block is omitted.",
    )
    price_range = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Price range",
        help_text="For Schema.org (for example: ₽₽). Omitted if blank.",
    )
    serves_cuisine = models.CharField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Cuisine types",
        help_text="Comma-separated values for Schema.org servesCuisine. Omitted if blank.",
    )
    inn = models.CharField(max_length=20, blank=True, default="", verbose_name="Tax ID")
    ogrn = models.CharField(max_length=20, blank=True, default="", verbose_name="Company registration ID")
    phone_number = models.CharField(max_length=30, verbose_name="Phone")
    email = models.EmailField(verbose_name="Email")
    telegram = models.URLField(max_length=300, blank=True, default="", verbose_name="Telegram")
    max_messenger = models.URLField(
        max_length=300, blank=True, default="", verbose_name="MAX messenger"
    )
    vk = models.URLField(
        max_length=300, blank=True, default="", verbose_name="VK"
    )
    reviews_url = models.URLField(
        max_length=1000,
        blank=True,
        default="",
        verbose_name="Reviews link (Avito)",
    )
    rkn_registry_url = models.URLField(
        max_length=1000,
        blank=True,
        default="",
        verbose_name="Roskomnadzor operator registry (link)",
        help_text="Link to the RKN registry entry (for example: https://example.com/registry/)",
    )
    rkn_registry_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Registry number",
        help_text="Detected automatically from the link (for example: 00-00-000000), or can be entered manually.",
    )
    min_order_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=5000,
        verbose_name="Minimum order amount (₽)",
    )
    free_delivery_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=10000,
        verbose_name="Free delivery threshold (₽)",
    )
    delivery_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=1500,
        verbose_name="Delivery cost (₽)",
    )
    hero_image_top = models.ImageField(
        upload_to="hero/",
        null=True,
        blank=True,
        verbose_name="Hero section image (top)",
    )
    hero_image_top_mobile = models.ImageField(
        upload_to="hero/",
        null=True,
        blank=True,
        verbose_name="Hero section image (top, mobile)",
    )
    hero_image_bottom = models.ImageField(
        upload_to="hero/",
        null=True,
        blank=True,
        verbose_name="Hero section image (bottom)",
    )
    og_image = models.ImageField(
        upload_to="company/",
        null=True,
        blank=True,
        verbose_name="Social media image (OG Image)",
        help_text="Main Open Graph image for website link previews in Telegram, VK, WhatsApp and search engines. A 1.91:1 aspect ratio is recommended (for example, 1200x630 px). Used on all website pages except product pages and individual blog posts.",
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    class Meta:
        verbose_name = "Company information"
        verbose_name_plural = "Company information"

    def __str__(self):
        return self.company_name

    def extract_rkn_number(self) -> str:
        """Automatically extract the operator number from the RKN registry link."""
        if self.rkn_registry_number:
            return self.rkn_registry_number
        if not self.rkn_registry_url:
            return ""
        import urllib.parse
        import re
        try:
            parsed = urllib.parse.urlparse(self.rkn_registry_url)
            params = urllib.parse.parse_qs(parsed.query)
            if "id" in params and params["id"]:
                return params["id"][0].strip()
        except Exception:
            pass
        match = re.search(r'(\d{2}-\d{2}-\d+)', self.rkn_registry_url)
        if match:
            return match.group(1)
        match = re.search(r'[?&]id=([^&#]+)', self.rkn_registry_url)
        if match:
            return match.group(1)
        return ""

    def save(self, *args, **kwargs):
        """Ensure a single record (singleton pattern) and optimize images to WebP."""
        self.pk = 1
        if self.rkn_registry_url and not self.rkn_registry_number:
            self.rkn_registry_number = self.extract_rkn_number()
        from ..catalog.image_utils import optimize_image_to_webp
        if self.hero_image_top:
            optimize_image_to_webp(self.hero_image_top, max_size=1920, quality=82)
        if self.hero_image_top_mobile:
            optimize_image_to_webp(self.hero_image_top_mobile, max_size=1200, quality=82)
        if self.hero_image_bottom:
            optimize_image_to_webp(self.hero_image_bottom, max_size=1920, quality=82)
        if self.og_image:
            optimize_image_to_webp(self.og_image, max_size=1200, quality=85)
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                "company_name": "Demo Catering",
                "legal_name": "",
                "city": "",
                "address": "",
                "latitude": None,
                "longitude": None,
                "price_range": "",
                "serves_cuisine": "",
                "inn": "",
                "ogrn": "",
                "phone_number": "",
                "email": "",
                "telegram": "",
                "max_messenger": "",
                "vk": "",
                "reviews_url": "",
            },
        )
        return obj


class FooterNavigation(models.Model):
    """
    Footer navigation items (CATALOG section).
    Linked to actual catalog categories.
    """
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="footer_navs",
        verbose_name="Category",
    )
    order = models.PositiveIntegerField(default=0, verbose_name="Sort order")

    class Meta:
        verbose_name = "Footer navigation"
        verbose_name_plural = "Footer navigation"
        ordering = ["order", "category__name"]

    def __str__(self):
        return self.category.name if self.category else f"FooterNav #{self.id}"


class PrivacyPolicy(models.Model):
    """
    Service privacy policy (singleton).
    Supports uploading a document file (.docx, .pdf, .md, .html, .txt),
    which is automatically converted to clean semantic HTML
    for native display on the website.
    """
    title = models.CharField(
        max_length=255,
        default="Privacy policy",
        verbose_name="Page title",
        help_text="Displayed in the H1 heading and page breadcrumbs.",
    )
    file = models.FileField(
        upload_to="documents/",
        blank=True,
        null=True,
        verbose_name="Document file (.docx, .pdf, .md, .html, .txt)",
        help_text="Upload a document file. When saved, its content is automatically converted to HTML for display on the website.",
    )
    content_html = models.TextField(
        blank=True,
        default="",
        verbose_name="HTML content",
        help_text="Generated policy HTML. Can also be edited directly by hand.",
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    class Meta:
        verbose_name = "Privacy policy"
        verbose_name_plural = "Privacy policy"

    def __str__(self):
        return self.title or "Privacy policy"

    def save(self, *args, **kwargs):
        self.pk = 1
        if self.file and not self.content_html:
            try:
                from .doc_converter import convert_document_to_html
                self.content_html = convert_document_to_html(self.file)
            except Exception:
                pass
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                "title": "Privacy policy",
                "content_html": "",
            },
        )
        return obj


class LegalDocument(models.Model):
    """
    Company legal document (Privacy policy, Terms of use, Public offer).
    Supports uploading a document file (.docx, .pdf, .md, .html, .txt),
    which is automatically converted to clean semantic HTML
    for native display on the website.
    """
    DOCUMENT_CHOICES = [
        ("privacy-policy", "Privacy policy"),
        ("user-agreement", "Terms of use"),
        ("public-offer", "Public offer"),
    ]

    slug = models.SlugField(
        max_length=100,
        unique=True,
        verbose_name="Type / URL (slug)",
        help_text="Defines the website page URL (for example: privacy-policy, user-agreement, public-offer)",
    )
    title = models.CharField(
        max_length=255,
        verbose_name="Page title",
        help_text="Displayed in the H1 heading and page breadcrumbs.",
    )
    file = models.FileField(
        upload_to="documents/",
        blank=True,
        null=True,
        verbose_name="Document file (.docx, .pdf, .md, .html, .txt)",
        help_text="Upload a document file. When saved, its content is automatically converted to HTML for display on the website.",
    )
    content_html = models.TextField(
        blank=True,
        default="",
        verbose_name="HTML content",
        help_text="Generated document HTML. Can also be edited directly by hand.",
    )
    order = models.PositiveIntegerField(default=0, verbose_name="Sort order")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    class Meta:
        verbose_name = "Legal document"
        verbose_name_plural = "Legal documents"
        ordering = ["order", "id"]

    def __str__(self):
        return self.title or self.slug

    def save(self, *args, **kwargs):
        if self.file and not self.content_html:
            try:
                from .doc_converter import convert_document_to_html
                self.content_html = convert_document_to_html(self.file)
            except Exception:
                pass
        super().save(*args, **kwargs)

    @classmethod
    def get_document(cls, slug: str):
        title_map = dict(cls.DOCUMENT_CHOICES)
        default_title = title_map.get(slug, slug.replace("-", " ").capitalize())
        doc, _ = cls.objects.get_or_create(
            slug=slug,
            defaults={
                "title": default_title,
                "content_html": "",
            },
        )
        return doc


