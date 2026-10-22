from django.db import models
from ..catalog.models import Product


class Order(models.Model):
    """
    Order placed through the cart (CartModal).

    Frontend constants:
      MIN_ORDER = 5000 ₽ - minimum order amount
      DELIVERY_THRESHOLD = 10000 ₽ - free delivery threshold
      DELIVERY_COST = 1500 ₽ - delivery fee
    """

    class StatusChoices(models.TextChoices):
        NEW = "new", "New"
        CONFIRMED = "confirmed", "Confirmed"
        IN_PROGRESS = "in_progress", "In progress"
        DELIVERED = "delivered", "Delivered"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    is_demo = models.BooleanField(default=False, editable=False, db_index=True, verbose_name="Portfolio / sandbox")
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.NEW,
        verbose_name="Status",
    )
    name = models.CharField(
        max_length=200,
        default="",
        blank=True,
        verbose_name="Customer name",
    )
    phone = models.CharField(
        max_length=30,
        default="",
        blank=True,
        verbose_name="Phone",
    )
    contact_method = models.CharField(
        max_length=50,
        default="Call me",
        verbose_name="Contact method",
    )
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Items total (₽)",
    )
    delivery_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Delivery cost (₽)",
    )
    final_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Final total (₽)",
    )
    guests = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Number of guests",
    )
    event_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Event date",
    )
    comment = models.TextField(blank=True, default="", verbose_name="Comment")
    cart_link = models.URLField(
        max_length=3000,
        blank=True,
        default="",
        verbose_name="Cart link",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    class Meta:
        verbose_name = "Order"
        verbose_name_plural = "Orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order №{self.pk} - {self.final_price} ₽ ({self.get_status_display()})"


class OrderItem(models.Model):
    """
    An order item is a snapshot of the product when the order is placed.
    The price and name are captured so catalog changes do not affect order history.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Order",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Product (reference)",
    )
    option = models.ForeignKey("catalog.ProductOption", on_delete=models.SET_NULL, null=True, blank=True)
    option_name = models.CharField(max_length=200, blank=True, default="")
    # Snapshot fields - data captured when the order is placed
    product_name = models.CharField(max_length=300, verbose_name="Name (snapshot)")
    product_image_url = models.URLField(
        max_length=500, blank=True, default="", verbose_name="Image URL (snapshot)"
    )
    price = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Unit price (₽)"
    )
    quantity = models.PositiveIntegerField(default=1, verbose_name="Quantity")
    subtotal = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Subtotal (₽)"
    )

    class Meta:
        verbose_name = "Order item"
        verbose_name_plural = "Order items"

    def __str__(self):
        return f"{self.product_name} × {self.quantity}"

    def save(self, *args, **kwargs):
        self.subtotal = self.price * self.quantity
        super().save(*args, **kwargs)


class SubmissionRateBucket(models.Model):
    """Short-lived HMAC peer counters shared by serverless workers; no raw IPs."""
    key = models.CharField(max_length=64, primary_key=True)
    count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(db_index=True)


class TelegramSubscriber(models.Model):
    username = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Telegram username",
        help_text="Without the @ symbol. Example: ivan_manager",
    )
    phone = models.CharField(
        max_length=30,
        blank=True,
        default="",
        verbose_name="Phone number",
        help_text="Example: +799****4567",
    )
    chat_id = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Telegram Chat ID",
        help_text="Filled automatically when the user connects through the bot",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Active",
        help_text="If unchecked, the user will no longer receive notifications",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    class Meta:
        verbose_name = "Telegram subscriber"
        verbose_name_plural = "Telegram subscribers"

    def __str__(self):
        identifiers = []
        if self.username:
            identifiers.append(f"@{self.username}")
        if self.phone:
            identifiers.append(self.phone)
        ident_str = " / ".join(identifiers) or "No identifier"
        
        status = "active" if self.is_active else "blocked"
        connected = "connected" if self.chat_id else "awaiting connection"
        return f"{ident_str} ({status}, {connected})"


class EmailSubscriber(models.Model):
    email = models.EmailField(
        unique=True,
        verbose_name="Email",
        help_text="Email address for receiving notifications",
    )
    name = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Owner name",
        help_text="Optional (e.g. Manager John)",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Active",
        help_text="If unchecked, this address will no longer receive notifications",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    class Meta:
        verbose_name = "Email subscriber"
        verbose_name_plural = "Email subscribers"

    def __str__(self):
        status = "active" if self.is_active else "disabled"
        if self.name:
            return f"{self.name} <{self.email}> ({status})"
        return f"{self.email} ({status})"
