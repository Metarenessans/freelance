import os
import re
from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from ..catalog.models import Product, ProductOption
from .portfolio import portfolio_enabled
from .models import Order, OrderItem


DELIVERY_THRESHOLD = 10000
DELIVERY_COST = 1500
MIN_ORDER = 5000


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "option",
            "option_name",
            "product_image_url",
            "price",
            "quantity",
            "subtotal",
        ]
        read_only_fields = ["id", "subtotal"]


class PriceInfoSerializer(serializers.Serializer):
    price = serializers.DecimalField(max_digits=10, decimal_places=2)


class StrictIntegerField(serializers.IntegerField):
    def to_internal_value(self, data):
        if isinstance(data, bool) or isinstance(data, float):
            self.fail("invalid")
        return super().to_internal_value(data)


class SelectedOptionSerializer(serializers.Serializer):
    id = StrictIntegerField(min_value=1, max_value=9223372036854775807)


class OrderItemCreateSerializer(serializers.Serializer):
    """
    Input format for an item from the frontend cart.
    Accepts the CartItem structure: { name, imageUrl, priceInfo: { price }, quantity }
    """
    name = serializers.CharField(max_length=300, required=False)
    imageUrl = serializers.URLField(max_length=500, allow_blank=True, default="")
    priceInfo = PriceInfoSerializer(required=False)
    quantity = StrictIntegerField(min_value=1, max_value=999)
    id = serializers.CharField(max_length=100, required=False, allow_null=True)
    productId = StrictIntegerField(min_value=1, max_value=9223372036854775807, required=False, allow_null=True)
    optionId = StrictIntegerField(min_value=1, max_value=9223372036854775807, required=False, allow_null=True)
    selectedOption = SelectedOptionSerializer(required=False, allow_null=True)


class OrderCreateSerializer(serializers.Serializer):
    """
    Create an order from the data the frontend passes to onSubmit:
    { items: CartItem[], totalPrice, finalPrice, name, phone, contact_method }
    """
    items = OrderItemCreateSerializer(many=True, max_length=50, allow_empty=False)
    name = serializers.CharField(max_length=200, required=True)
    phone = serializers.CharField(max_length=30, required=True)
    contact_method = serializers.CharField(max_length=50, default="Call me", required=False)
    comment = serializers.CharField(max_length=2000, allow_blank=True, default="", required=False)
    cart_link = serializers.URLField(max_length=3000, allow_blank=True, default="", required=False)
    guests = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    event_date = serializers.DateField(required=False, allow_null=True)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("The cart cannot be empty.")
        return items

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        resolved = []
        seen = set()
        for item in items_data:
            product_id = item.get("productId") or item.get("id")
            if (not product_id or not re.fullmatch(r"[0-9]{1,19}", str(product_id))
                    or not 1 <= int(product_id) <= 9223372036854775807):
                raise serializers.ValidationError({"items": "A valid productId is required."})
            product = Product.objects.filter(pk=int(product_id), is_active=True).first()
            if product is None or (product.category and not product.category.is_active):
                raise serializers.ValidationError({"items": "Product is unavailable."})
            option_id = item.get("optionId")
            selected_id = (item.get("selectedOption") or {}).get("id")
            if option_id and selected_id and option_id != selected_id:
                raise serializers.ValidationError({"items": "Conflicting option IDs."})
            option_id = option_id or selected_id
            option = None
            if option_id:
                option = ProductOption.objects.filter(pk=option_id, product=product, is_active=True).first()
                if option is None:
                    raise serializers.ValidationError({"items": "Option is unavailable for this product."})
            elif product.options.exists():
                raise serializers.ValidationError({"items": "Select a product option."})
            key = (product.pk, option.pk if option else None)
            if key in seen:
                raise serializers.ValidationError({"items": "Duplicate product/option lines are not allowed."})
            seen.add(key)
            minimum = option.min_order_quantity if option and option.min_order_quantity is not None else product.min_order_quantity
            if item["quantity"] < (minimum or 1):
                raise serializers.ValidationError({"items": f"Minimum quantity is {minimum}."})
            price = option.price if option else product.price
            if price <= 0:
                raise serializers.ValidationError({"items": "Product price is unavailable."})
            resolved.append((product, option, price, item["quantity"]))
        total_price = sum((price * quantity for _, _, price, quantity in resolved), Decimal("0.00"))
        if total_price > Decimal("9999999999.99"):
            raise serializers.ValidationError({"items": "Order amount exceeds the supported limit."})
        if total_price < MIN_ORDER:
            raise serializers.ValidationError(f"The minimum order amount is {MIN_ORDER}.")
        delivery_cost = Decimal("0.00") if total_price >= DELIVERY_THRESHOLD else Decimal(str(DELIVERY_COST)).quantize(Decimal("0.01"))
        if not validated_data.get("cart_link") and resolved:
            frontend_url = os.getenv("FRONTEND_URL", "https://catering-portfolio-six.vercel.app").rstrip("/")
            encoded_items = ",".join(f"{p.id}:{q}" + (f":{opt.id}" if opt else "") for p, opt, _, q in resolved)
            validated_data["cart_link"] = f"{frontend_url}/?cart={encoded_items}"
        order = Order.objects.create(**validated_data, is_demo=portfolio_enabled(),
                                     total_price=total_price, delivery_cost=delivery_cost,
                                     final_price=total_price + delivery_cost)
        for product, option, price, quantity in resolved:
            OrderItem.objects.create(order=order, product=product, product_name=product.name,
                                     option=option, option_name=option.name if option else "",
                                     product_image_url=product.effective_image_url,
                                     price=price, quantity=quantity)
        return order


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "is_demo",
            "name",
            "phone",
            "contact_method",
            "guests",
            "event_date",
            "total_price",
            "delivery_cost",
            "final_price",
            "comment",
            "cart_link",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_demo", "created_at", "updated_at"]


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status"]
