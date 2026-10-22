from ..orders.portfolio import portfolio_enabled, submissions_enabled
from ..orders.submissions import PublicSubmissionMixin
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import MenuRequest, AdditionalService, EventFormat
from .serializers import (
    MenuRequestSerializer,
    MenuRequestCreateSerializer,
    MenuRequestStatusUpdateSerializer,
    AdditionalServiceSerializer,
    EventFormatSerializer,
)
from .filters import MenuRequestFilter


class MenuRequestViewSet(PublicSubmissionMixin, viewsets.ModelViewSet):
    """
    Manage menu planning requests.
    
    POST  /api/v1/menu-requests/            - create a request (public)
    GET   /api/v1/menu-requests/            - list requests (admin only)
    GET   /api/v1/menu-requests/{id}/       - request details (admin only)
    PATCH /api/v1/menu-requests/{id}/status/ - update status (admin only)
    """
    queryset = MenuRequest.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = MenuRequestFilter
    search_fields = ["name", "phone", "format"]
    ordering_fields = ["created_at", "date", "guests", "status"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return MenuRequestCreateSerializer
        if self.action == "update_status":
            return MenuRequestStatusUpdateSerializer
        return MenuRequestSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def create(self, request, *args, **kwargs):
        if not submissions_enabled():
            return Response({"detail": "This demonstration does not accept real customer submissions."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        serializer = MenuRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        menu_request = serializer.save(is_demo=portfolio_enabled())
        return Response({"id": menu_request.pk, "status": menu_request.status, "is_demo": menu_request.is_demo},
                        status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        """Update request status/notes."""
        obj = self.get_object()
        serializer = MenuRequestStatusUpdateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MenuRequestSerializer(obj).data)


class AdditionalServiceViewSet(viewsets.ModelViewSet):
    """
    CRUD for additional services (on-site table setup, Waitstaff, etc.).
    """
    queryset = AdditionalService.objects.all()
    serializer_class = AdditionalServiceSerializer
    pagination_class = None
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["label"]
    ordering = ["order"]

    def get_queryset(self):
        qs = AdditionalService.objects.all()
        if self.request.user and self.request.user.is_staff:
            return qs
        return qs.filter(is_active=True)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class EventFormatViewSet(viewsets.ModelViewSet):
    """
    CRUD for event types (Anniversary, Wedding, Buffet, etc.).
    """
    queryset = EventFormat.objects.all()
    serializer_class = EventFormatSerializer
    pagination_class = None
    filter_backends = [OrderingFilter]
    ordering = ["order"]

    def get_queryset(self):
        qs = EventFormat.objects.all()
        if self.request.user and self.request.user.is_staff:
            return qs
        return qs.filter(is_active=True)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import CalculatePageSettings
from .serializers import CalculatePageSettingsSerializer


class CalculatePageSettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        settings = CalculatePageSettings.load()
        serializer = CalculatePageSettingsSerializer(settings)
        return Response(serializer.data)
