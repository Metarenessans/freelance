import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    """
    Product filters.
    Supports category, section, price range, featured status, and active status.
    """
    category = django_filters.CharFilter(
        field_name="category__slug",
        lookup_expr="exact",
        label="Category (slug)",
    )
    section = django_filters.CharFilter(
        field_name="category__sections__slug",
        lookup_expr="exact",
        label="Section (slug)",
    )
    slug = django_filters.CharFilter(
        field_name="slug",
        lookup_expr="exact",
        label="Product slug",
    )
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    is_featured = django_filters.BooleanFilter()
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = Product
        fields = ["slug", "category", "section", "min_price", "max_price", "is_featured", "is_active"]
