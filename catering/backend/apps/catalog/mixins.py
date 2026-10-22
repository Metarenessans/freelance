from django.urls import path
from django.shortcuts import redirect
from django.urls import reverse
from django.contrib import messages
from django.db import transaction, models


class MakeFirstAdminMixin:
    """
    ModelAdmin mixin that adds a "Make first" button to the edit form.
    Clicking moves the item to the first position and normalizes the order of the remaining items.
    """
    change_form_template = "admin/change_form_with_make_first.html"
    sortable_group_by = None  # Field name (for example, 'category') for filtering within a group

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<path:object_id>/change/make-first/",
                self.admin_site.admin_view(self.make_first_view),
                name="%s_%s_make_first" % (self.model._meta.app_label, self.model._meta.model_name),
            ),
        ]
        return custom_urls + urls

    def make_first_view(self, request, object_id):
        obj = self.get_object(request, object_id)
        if obj is None:
            messages.error(request, "Object not found.")
            return redirect(f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist")

        try:
            with transaction.atomic():
                # Sort field name (usually 'order')
                order_field = getattr(self, "sortable_field_name", "order")

                # Filter by group if specified (for example, products by category)
                filter_kwargs = {}
                group_field = getattr(self, "sortable_group_by", None)
                if group_field and hasattr(obj, group_field):
                    group_val = getattr(obj, group_field)
                    filter_kwargs[group_field] = group_val

                queryset = self.model.objects.filter(**filter_kwargs)

                # Temporarily assign the current object the minimum order of 0
                setattr(obj, order_field, 0)
                obj.save(update_fields=[order_field])

                # Sort all items in the group and reassign consecutive positions 1, 2, 3...
                sorted_objs = queryset.order_by(order_field, "id")
                for idx, item in enumerate(sorted_objs, start=1):
                    if getattr(item, order_field) != idx:
                        setattr(item, order_field, idx)
                        item.save(update_fields=[order_field])

            messages.success(request, f'Item "{obj}" was successfully moved to the top of the list.')
        except Exception as e:
            messages.error(request, f"Error moving item: {str(e)}")

        return redirect(reverse(f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"))
