from django.apps import AppConfig


class MenuRequestsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.menu_requests"
    verbose_name = "Menu estimate requests"

    def ready(self):
        from . import signals

