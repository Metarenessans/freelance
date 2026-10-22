from django.contrib import admin
from django.urls import path, reverse
from django.utils.safestring import mark_safe
from django.http import HttpResponseRedirect
from django.contrib import messages
from adminsortable2.admin import SortableAdminMixin, SortableInlineAdminMixin, SortableAdminBase
from django.forms import Textarea, TextInput
from django.db import models
from .models import (
    MenuRequest,
    AdditionalService,
    EventFormat,
    CalculatePageSettings,
    CalculateFeature,
    CalculateBudgetOption,
    CalculateFoodOption,
    CalculateStep,
    CalculateFAQ,
)
from ..catalog.mixins import MakeFirstAdminMixin
from ..orders.telegram import send_menu_request_telegram_notification
from ..orders.portfolio import outbound_disabled


@admin.register(MenuRequest)
class MenuRequestAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "is_demo",
        "name",
        "phone",
        "contact_method",
        "format",
        "guests",
        "budget",
        "date",
        "status",
        "created_at",
    ]
    list_filter = ["status", "is_demo", "format", "date"]
    search_fields = ["name", "phone", "format"]
    ordering = ["-created_at"]
    readonly_fields = [
        "is_demo",
        "created_at",
        "updated_at",
        "food_preferences",
        "additional_services",
        "additional_services_display",
        "send_telegram_button",
    ]
    list_editable = ["status"]


    fieldsets = [
        (
            "Event details",
            {
                "fields": ["format", "guests", "budget", "date", "food_preferences"],
            },
        ),
        (
            "Contact details",
            {
                "fields": ["name", "phone", "contact_method", "consent"],
            },
        ),
        (
            "Services",
            {
                "fields": ["additional_services_display"],
            },
        ),
        (
            "Status and notes",
            {
                "fields": ["status", "is_demo", "notes"],
            },
        ),
        (
            "Notification testing",
            {
                "fields": ["send_telegram_button"],
            },
        ),
        (
            "System information",
            {
                "fields": ["created_at", "updated_at", "additional_services"],
                "classes": ["collapse"],
            },
        ),
    ]

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<path:object_id>/send-telegram/',
                self.admin_site.admin_view(self.send_telegram_view),
                name='menu-request-send-telegram',
            ),
            path(
                '<path:object_id>/send-email/',
                self.admin_site.admin_view(self.send_email_view),
                name='menu-request-send-email',
            ),
        ]
        return custom_urls + urls

    def send_telegram_view(self, request, object_id):
        obj = self.get_object(request, object_id)
        if obj:
            try:
                send_menu_request_telegram_notification(obj)
                self.message_user(request, "Telegram notification sent successfully!", messages.SUCCESS)
            except Exception as e:
                self.message_user(request, f"Error sending notification: {e}", messages.ERROR)
        return HttpResponseRedirect("../change/")

    def send_email_view(self, request, object_id):
        obj = self.get_object(request, object_id)
        if obj:
            try:
                from ..orders.email import send_menu_request_email_notification_sync
                send_menu_request_email_notification_sync(obj.id, raise_exception=True)
                self.message_user(request, "Email notification sent successfully!", messages.SUCCESS)
            except Exception as e:
                self.message_user(request, f"Error sending notification: {e}", messages.ERROR)
        return HttpResponseRedirect("../change/")

    @admin.display(description="Send notifications")
    def send_telegram_button(self, obj):
        if outbound_disabled():
            return "Notifications disabled."
        if obj and obj.pk:
            tg_url = reverse('admin:menu-request-send-telegram', args=[obj.pk])
            email_url = reverse('admin:menu-request-send-email', args=[obj.pk])
            return mark_safe(
                f'<a class="button" href="{tg_url}" style="background-color: #007bff; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; text-decoration: none; display: inline-block; margin-right: 10px;">'
                f'Send to Telegram'
                f'</a>'
                f'<a class="button" href="{email_url}" style="background-color: #28a745; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; text-decoration: none; display: inline-block;">'
                f'Send by email'
                f'</a>'
            )
        return "Save the object first"

    def additional_services_display(self, obj):
        service_ids = obj.additional_services
        if not service_ids or not isinstance(service_ids, list):
            return "No services selected"

        # Get all services that exist in the database with their linked products
        services = AdditionalService.objects.filter(pk__in=service_ids).select_related('linked_product')
        services_dict = {str(service.id): service for service in services}

        html = ["<ul style='margin: 0; padding-left: 20px;'>"]
        for sid in service_ids:
            service = services_dict.get(str(sid))
            if service:
                # Link to the service admin change page
                try:
                    service_admin_url = reverse('admin:menu_requests_additionalservice_change', args=[service.id])
                    service_link = f'<a href="{service_admin_url}"><strong>{service.label}</strong></a>'
                except Exception:
                    service_link = f'<strong>{service.label}</strong>'

                if service.linked_product:
                    # Link to the linked product admin change page
                    try:
                        product_admin_url = reverse('admin:catalog_product_change', args=[service.linked_product.id])
                        product_link = f'<a href="{product_admin_url}" style="font-weight: bold; color: #447e9b;">{service.linked_product.name}</a>'
                    except Exception:
                        product_link = service.linked_product.name

                    html.append(f"<li style='margin-bottom: 5px;'>{service_link} &mdash; Linked product: {product_link}</li>")
                else:
                    html.append(f"<li style='margin-bottom: 5px;'>{service_link} &mdash; <span style='color: #888;'>No linked product</span></li>")
            else:
                html.append(f"<li style='margin-bottom: 5px; color: #cc1111;'>Service with ID {sid} was not found in the database</li>")

        html.append("</ul>")
        return mark_safe("".join(html))

    additional_services_display.short_description = "Additional services"


@admin.register(EventFormat)
class EventFormatAdmin(SortableAdminMixin, MakeFirstAdminMixin, admin.ModelAdmin):
    list_display = ["order", "name", "is_active"]
    list_editable = ["is_active"]
    search_fields = ["name"]
    ordering = ["order"]





class CalculateFeatureInline(SortableInlineAdminMixin, admin.TabularInline):
    model = CalculateFeature
    extra = 0
    fields = ["order", "icon", "title", "subtitle", "is_active"]
    ordering = ["order"]
    formfield_overrides = {
        models.CharField: {"widget": TextInput(attrs={"style": "width: 100%;"})},
    }
    verbose_name = "Benefit"
    verbose_name_plural = "1. Benefit cards (below the header)"


class CalculateBudgetOptionInline(SortableInlineAdminMixin, admin.TabularInline):
    model = CalculateBudgetOption
    extra = 0
    fields = ["order", "name", "is_active"]
    ordering = ["order"]
    formfield_overrides = {
        models.CharField: {"widget": TextInput(attrs={"style": "width: 100%; min-width: 250px;"})},
    }
    verbose_name = "Budget option"
    verbose_name_plural = "2. Estimated budget options (in the form)"


class CalculateFoodOptionInline(SortableInlineAdminMixin, admin.TabularInline):
    model = CalculateFoodOption
    extra = 0
    fields = ["order", "name", "is_active"]
    ordering = ["order"]
    formfield_overrides = {
        models.CharField: {"widget": TextInput(attrs={"style": "width: 100%; min-width: 200px;"})},
    }
    verbose_name = "Dish type"
    verbose_name_plural = "3. Food preferences (in the form)"


class AdditionalServiceInline(SortableInlineAdminMixin, admin.TabularInline):
    model = AdditionalService
    extra = 0
    fields = ["order", "label", "description", "linked_product", "is_active"]
    ordering = ["order"]
    autocomplete_fields = ["linked_product"]
    formfield_overrides = {
        models.TextField: {"widget": Textarea(attrs={"rows": 2, "style": "width: 100%; min-width: 220px;"})},
    }
    verbose_name = "Additional service"
    verbose_name_plural = "4. Additional services (in the form)"


class CalculateStepInline(SortableInlineAdminMixin, admin.TabularInline):
    model = CalculateStep
    extra = 0
    fields = ["order", "step", "title", "text", "is_active"]
    ordering = ["order"]
    formfield_overrides = {
        models.TextField: {"widget": Textarea(attrs={"rows": 2, "style": "width: 100%; min-width: 260px;"})},
    }
    verbose_name = "Process step"
    verbose_name_plural = "5. Process steps (How we work)"


class CalculateFAQInline(SortableInlineAdminMixin, admin.TabularInline):
    model = CalculateFAQ
    extra = 0
    fields = ["order", "question", "answer", "is_active"]
    ordering = ["order"]
    formfield_overrides = {
        models.TextField: {"widget": Textarea(attrs={"rows": 3, "style": "width: 100%; min-width: 320px;"})},
    }
    verbose_name = "Question FAQ"
    verbose_name_plural = "6. Questions and answers (FAQ)"


@admin.register(CalculatePageSettings)
class CalculatePageSettingsAdmin(SortableAdminBase, admin.ModelAdmin):
    inlines = [
        CalculateFeatureInline,
        CalculateBudgetOptionInline,
        CalculateFoodOptionInline,
        AdditionalServiceInline,
        CalculateStepInline,
        CalculateFAQInline,
    ]
    readonly_fields = ["updated_at"]
    fieldsets = [
        (
            "Hero section (menu estimate page header)",
            {
                "fields": ["hero_badge", "hero_title", "hero_description"],
            },
        ),
        (
            "How we work section (headings)",
            {
                "fields": ["steps_title", "steps_subtitle"],
            },
        ),
        (
            "FAQ section (headings)",
            {
                "fields": ["faq_title", "faq_subtitle"],
            },
        ),
        (
            "SEO (page search engine optimization)",
            {
                "fields": ["seo_title", "seo_description"],
            },
        ),
        (
            "System information",
            {
                "fields": ["updated_at"],
                "classes": ["collapse"],
            },
        ),
    ]

    class Media:
        css = {
            "all": ["admin/css/sortable_custom.css", "admin/css/char_counter.css"]
        }
        js = [
            "admin/js/sortable_inline_arrows.js", "admin/js/char_counter.js",
        ]

    def changelist_view(self, request, extra_context=None):
        obj = CalculatePageSettings.load()
        return HttpResponseRedirect(
            reverse("admin:menu_requests_calculatepagesettings_change", args=[obj.pk])
        )

    def has_add_permission(self, request):
        return not CalculatePageSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
