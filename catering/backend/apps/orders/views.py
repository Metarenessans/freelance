from .portfolio import submissions_enabled
from .submissions import PublicSubmissionMixin
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import Order
from .serializers import (
    OrderSerializer,
    OrderCreateSerializer,
    OrderStatusUpdateSerializer,
)
from .filters import OrderFilter


class OrderViewSet(PublicSubmissionMixin, viewsets.ModelViewSet):
    """
    Order management.

    POST   /api/v1/orders/        — create an order from the cart (public)
    GET    /api/v1/orders/        — list all orders (admin only)
    GET    /api/v1/orders/{id}/   — order details (admin only)
    PATCH  /api/v1/orders/{id}/status/ — update the status (admin only)
    DELETE /api/v1/orders/{id}/   — delete an order (admin only)
    """
    queryset = Order.objects.prefetch_related("items").all()
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = OrderFilter
    ordering_fields = ["created_at", "final_price", "status"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action == "update_status":
            return OrderStatusUpdateSerializer
        return OrderSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def create(self, request, *args, **kwargs):
        if not submissions_enabled():
            return Response({"detail": "This demonstration does not accept real customer submissions."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response({"id": order.pk, "status": order.status, "is_demo": order.is_demo,
                         "total_price": str(order.total_price), "delivery_cost": str(order.delivery_cost),
                         "final_price": str(order.final_price)}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        """Update the order status."""
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderSerializer(order).data)
