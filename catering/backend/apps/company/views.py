from rest_framework import generics, permissions
from .models import CompanyInfo, FooterNavigation, LegalDocument, PrivacyPolicy
from .serializers import (
    CompanyInfoSerializer,
    FooterNavigationSerializer,
    LegalDocumentSerializer,
    PrivacyPolicySerializer,
)


class CompanyInfoView(generics.RetrieveUpdateAPIView):
    # ... existing code ...
    serializer_class = CompanyInfoSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_object(self):
        return CompanyInfo.load()


class FooterNavigationListView(generics.ListAPIView):
    """
    List footer navigation items.
    """
    queryset = FooterNavigation.objects.all()
    serializer_class = FooterNavigationSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Disable pagination for this list


class LegalDocumentListView(generics.ListAPIView):
    """
    List all company legal documents.
    """
    queryset = LegalDocument.objects.all()
    serializer_class = LegalDocumentSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class LegalDocumentDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve a specific legal document by slug.
    GET is public; PUT/PATCH are restricted to administrators.
    """
    queryset = LegalDocument.objects.all()
    serializer_class = LegalDocumentSerializer
    lookup_field = "slug"

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_object(self):
        slug = self.kwargs.get("slug")
        return LegalDocument.get_document(slug)


class PrivacyPolicyView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update the privacy policy.
    GET is public; PUT/PATCH are restricted to administrators.
    """
    serializer_class = LegalDocumentSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_object(self):
        return LegalDocument.get_document("privacy-policy")


