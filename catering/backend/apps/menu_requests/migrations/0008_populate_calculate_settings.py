from django.db import migrations

def populate_initial_calculate_settings(apps, schema_editor):
    CalculatePageSettings = apps.get_model("menu_requests", "CalculatePageSettings")
    CalculateFAQ = apps.get_model("menu_requests", "CalculateFAQ")

    settings, _ = CalculatePageSettings.objects.get_or_create(
        pk=1,
        defaults={
            "hero_badge": "⚡ Free estimate in 15 minutes",
            "hero_title": "Get a catering and banquet menu estimate in your area",
            "hero_description": "Tell us the event type, number of guests and your preferences, and we will prepare a personalized menu and estimate for your budget free of charge.",
            "seo_title": "Online catering menu estimate - Free banquet and buffet estimate | Demo Catering",
            "seo_description": "Free online catering menu estimate for your event type, guest count and budget in your area. A personalized estimate in 15 minutes!",
        }
    )

    initial_faqs = [
        {
            "question": "How much does a catering menu estimate cost?",
            "answer": "Menu planning and a personalized estimate are completely free and carry no obligation. We will prepare options to suit your budget.",
            "order": 1,
        },
        {
            "question": "How many days in advance should I book catering?",
            "answer": "We send the estimate within 15-30 minutes. We recommend booking the event at least 3 days in advance.",
            "order": 2,
        },
        {
            "question": "Do you provide tableware and waitstaff?",
            "answer": "Yes. In addition to delivering prepared food boxes and dishes, we can provide tableware, glasses, linens and professional waitstaff for your event as an additional service.",
            "order": 3,
        },
        {
            "question": "How is the food packaged for delivery?",
            "answer": "All appetizers and dishes are delivered in stylish boxes with a clear window. Multiple boxes are packed in bags for easy carrying.",
            "order": 4,
        },
    ]

    for faq in initial_faqs:
        CalculateFAQ.objects.get_or_create(
            settings=settings,
            question=faq["question"],
            defaults={
                "answer": faq["answer"],
                "order": faq["order"],
                "is_active": True,
            }
        )

def remove_initial_calculate_settings(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("menu_requests", "0007_calculatepagesettings_alter_menurequest_options_and_more"),
    ]

    operations = [
        migrations.RunPython(
            populate_initial_calculate_settings,
            reverse_code=remove_initial_calculate_settings,
        ),
    ]
