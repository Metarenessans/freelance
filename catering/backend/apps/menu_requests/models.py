from django.db import models
from ..catalog.models import Product


class CalculatePageSettings(models.Model):
    """
    Menu estimate page settings (/calculate): a single record (singleton).
    """
    # 1. Hero section
    hero_badge = models.CharField(
        max_length=150,
        default="⚡ Free estimate in 15 minutes",
        verbose_name="Header badge",
        help_text="Short badge above the heading",
    )
    hero_title = models.CharField(
        max_length=255,
        default="Get a catering and banquet menu estimate in your area",
        verbose_name="Page title (H1)",
    )
    hero_description = models.TextField(
        default="Tell us the event type, number of guests and your preferences, and we will prepare a personalized menu and estimate for your budget free of charge.",
        verbose_name="Page subtitle / description",
    )

    # 2. How we work section
    steps_title = models.CharField(
        max_length=150,
        default="How we work",
        verbose_name="Process section heading",
    )
    steps_subtitle = models.CharField(
        max_length=255,
        default="A clear and convenient process for preparing your celebration menu",
        verbose_name="Process section subtitle",
    )

    # 3. FAQ section
    faq_title = models.CharField(
        max_length=150,
        default="Frequently asked questions about menu estimates",
        verbose_name="FAQ section heading",
    )
    faq_subtitle = models.CharField(
        max_length=255,
        default="Answers to common questions about dish selection, timing and table service",
        verbose_name="FAQ section subtitle",
    )

    # 4. SEO meta tags
    seo_title = models.CharField(
        max_length=255,
        blank=True,
        default="Online catering menu estimate - Free banquet and buffet estimate | Demo Catering",
        verbose_name="SEO title (Meta Title)",
        help_text="Leave blank to use the default value",
    )
    seo_description = models.TextField(
        blank=True,
        default="Free online catering menu estimate for your event type, guest count and budget in your area. A personalized estimate in 15 minutes!",
        verbose_name="SEO Description (Meta Description)",
        help_text="Leave blank to use the default value",
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    class Meta:
        verbose_name = "Menu estimate page settings"
        verbose_name_plural = "Menu estimate page settings"

    def __str__(self):
        return "Menu estimate page settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class AdditionalService(models.Model):
    """
    Additional service for menu planning.
    Managed within the menu estimate page settings.
    """
    settings = models.ForeignKey(
        CalculatePageSettings,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        default=1,
        related_name="additional_services",
        verbose_name="Page settings",
    )
    label = models.CharField(max_length=200, verbose_name="Service name")
    description = models.TextField(blank=True, default="", verbose_name="Description")
    linked_product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="linked_services",
        verbose_name="Linked product",
        help_text="Product opened when clicking 'learn more'"
    )
    order = models.PositiveIntegerField(default=0, verbose_name="Order")
    is_active = models.BooleanField(default=True, verbose_name="Active")

    class Meta:
        verbose_name = "Additional service"
        verbose_name_plural = "Additional services"
        ordering = ["order"]

    def __str__(self):
        return self.label


class CalculateFeature(models.Model):
    """
    Benefit (3 cards below the hero section).
    """
    settings = models.ForeignKey(
        CalculatePageSettings,
        on_delete=models.CASCADE,
        related_name="features",
        default=1,
        verbose_name="Page settings",
    )
    icon = models.CharField(max_length=20, default="⏱️", verbose_name="Icon / Emoji")
    title = models.CharField(max_length=150, verbose_name="Heading")
    subtitle = models.CharField(max_length=255, verbose_name="Subtitle")
    order = models.PositiveIntegerField(default=0, verbose_name="Order")
    is_active = models.BooleanField(default=True, verbose_name="Active")

    class Meta:
        verbose_name = "Benefit"
        verbose_name_plural = "Benefits (cards below the hero section)"
        ordering = ["order"]

    def __str__(self):
        return f"{self.icon} {self.title}"


class CalculateBudgetOption(models.Model):
    """
    Estimated budget option for the estimate form.
    """
    settings = models.ForeignKey(
        CalculatePageSettings,
        on_delete=models.CASCADE,
        related_name="budget_options",
        default=1,
        verbose_name="Page settings",
    )
    name = models.CharField(max_length=150, verbose_name="Budget option")
    order = models.PositiveIntegerField(default=0, verbose_name="Order")
    is_active = models.BooleanField(default=True, verbose_name="Active")

    class Meta:
        verbose_name = "Budget option"
        verbose_name_plural = "Estimated budget options"
        ordering = ["order"]

    def __str__(self):
        return self.name


class CalculateFoodOption(models.Model):
    """
    Dish type option (cuisine preferences).
    """
    settings = models.ForeignKey(
        CalculatePageSettings,
        on_delete=models.CASCADE,
        related_name="food_options",
        default=1,
        verbose_name="Page settings",
    )
    name = models.CharField(max_length=150, verbose_name="Dish type")
    order = models.PositiveIntegerField(default=0, verbose_name="Order")
    is_active = models.BooleanField(default=True, verbose_name="Active")

    class Meta:
        verbose_name = "Dish type"
        verbose_name_plural = "Food preferences"
        ordering = ["order"]

    def __str__(self):
        return self.name


class CalculateStep(models.Model):
    """
    Process step («How we work»).
    """
    settings = models.ForeignKey(
        CalculatePageSettings,
        on_delete=models.CASCADE,
        related_name="steps",
        default=1,
        verbose_name="Page settings",
    )
    step = models.CharField(max_length=10, default="01", verbose_name="Step number (01, 02...)")
    title = models.CharField(max_length=150, verbose_name="Step heading")
    text = models.TextField(verbose_name="Step description")
    order = models.PositiveIntegerField(default=0, verbose_name="Order")
    is_active = models.BooleanField(default=True, verbose_name="Active")

    class Meta:
        verbose_name = "Process step"
        verbose_name_plural = "Process steps (How we work)"
        ordering = ["order"]

    def __str__(self):
        return f"{self.step} {self.title}"


class CalculateFAQ(models.Model):
    """
    FAQ question and answer for the menu estimate page.
    """
    settings = models.ForeignKey(
        CalculatePageSettings,
        on_delete=models.CASCADE,
        related_name="faqs",
        verbose_name="Page settings",
        default=1,
    )
    question = models.CharField(max_length=300, verbose_name="Question")
    answer = models.TextField(verbose_name="Answer")
    order = models.PositiveIntegerField(default=0, verbose_name="Order")
    is_active = models.BooleanField(default=True, verbose_name="Active")

    class Meta:
        verbose_name = "Question FAQ"
        verbose_name_plural = "FAQ questions"
        ordering = ["order"]

    def __str__(self):
        return self.question


class EventFormat(models.Model):
    """
    Event format.
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="Name")
    order = models.PositiveIntegerField(default=0, verbose_name="Order")
    is_active = models.BooleanField(default=True, verbose_name="Active")

    class Meta:
        verbose_name = "Event format"
        verbose_name_plural = "Event types"
        ordering = ["order"]

    def __str__(self):
        return self.name


class MenuRequest(models.Model):
    """
    Menu estimate request submitted from the estimate form / MenuPopup.
    """

    class StatusChoices(models.TextChoices):
        NEW = "new", "New"
        PROCESSING = "processing", "Processing"
        DONE = "done", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    is_demo = models.BooleanField(default=False, editable=False, db_index=True, verbose_name="Portfolio / sandbox")
    format = models.CharField(max_length=100, verbose_name="Event format")
    guests = models.CharField(max_length=100, blank=True, default="", verbose_name="Number of guests")
    budget = models.CharField(max_length=100, blank=True, default="", verbose_name="Estimated budget")
    date = models.DateField(null=True, blank=True, verbose_name="Event date")
    food_preferences = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Food preferences",
        help_text="List of strings: [\"Soups and broths\", \"Hot dishes\", ...]",
    )

    additional_services = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Additional services",
        help_text="List of service IDs: [\"1\", \"2\", ...]",
    )
    name = models.CharField(max_length=200, verbose_name="Customer name")
    phone = models.CharField(max_length=30, verbose_name="Phone")
    contact_method = models.CharField(
        max_length=50,
        default="Call me",
        verbose_name="Contact method",
    )
    consent = models.BooleanField(default=True, verbose_name="Consent to the policy")

    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.NEW,
        verbose_name="Status",
    )
    notes = models.TextField(blank=True, default="", verbose_name="Manager notes")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    class Meta:
        verbose_name = "Menu estimate request"
        verbose_name_plural = "Menu estimate requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Request No.{self.pk} - {self.name} ({self.format}, {self.date})"
