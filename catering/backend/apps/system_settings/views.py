from rest_framework import generics, permissions
from .models import SystemSettings, SeoSettings
from .serializers import SystemSettingsSerializer, SeoSettingsSerializer


class SystemSettingsView(generics.RetrieveAPIView):
    """
    Return public system settings.
    """
    serializer_class = SystemSettingsSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        return SystemSettings.load()


class SeoSettingsView(generics.RetrieveAPIView):
    """
    Return the singleton SEO settings.
    """
    serializer_class = SeoSettingsSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        return SeoSettings.load()
