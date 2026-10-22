from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import FaqItem
from .serializers import FaqItemSerializer


class FaqItemViewSet(viewsets.ModelViewSet):
    """
    CRUD for FAQ questions.
    
    GET  /api/v1/faq/  - list questions (public)
    POST /api/v1/faq/  - create a question (admin only)
    """
    queryset = FaqItem.objects.filter(is_active=True)
    serializer_class = FaqItemSerializer
    pagination_class = None
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["question"]
    ordering_fields = ["order"]
    ordering = ["order"]

    def get_queryset(self):
        if self.request.user and self.request.user.is_staff:
            return FaqItem.objects.all()
        return FaqItem.objects.filter(is_active=True)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
