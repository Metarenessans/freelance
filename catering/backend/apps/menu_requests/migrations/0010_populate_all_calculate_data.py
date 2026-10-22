from django.db import migrations

def populate_calculate_data(apps, schema_editor):
    CalculatePageSettings = apps.get_model("menu_requests", "CalculatePageSettings")
    CalculateFeature = apps.get_model("menu_requests", "CalculateFeature")
    CalculateBudgetOption = apps.get_model("menu_requests", "CalculateBudgetOption")
    CalculateFoodOption = apps.get_model("menu_requests", "CalculateFoodOption")
    CalculateStep = apps.get_model("menu_requests", "CalculateStep")
    AdditionalService = apps.get_model("menu_requests", "AdditionalService")

    settings, _ = CalculatePageSettings.objects.get_or_create(pk=1)

    # 1. Features (3 cards under hero)
    features_data = [
        {"icon": "⏱️", "title": "An estimate in 15 minutes", "subtitle": "Quick estimate via WhatsApp/Telegram", "order": 1},
        {"icon": "💰", "title": "100% free", "subtitle": "The estimate carries no obligation", "order": 2},
        {"icon": "🍽️", "title": "For any budget", "subtitle": "From a light buffet to a lavish banquet", "order": 3},
    ]
    for item in features_data:
        CalculateFeature.objects.get_or_create(
            settings=settings,
            title=item["title"],
            defaults={"icon": item["icon"], "subtitle": item["subtitle"], "order": item["order"], "is_active": True}
        )

    # 2. Budget options
    budget_data = [
        "Undecided / please advise",
        "up to 15 000 ₽",
        "15 000 - 30 000 ₽",
        "30 000 - 50 000 ₽",
        "50 000 - 100 000 ₽",
        "from 100 000 ₽",
    ]
    for idx, name in enumerate(budget_data, start=1):
        CalculateBudgetOption.objects.get_or_create(
            settings=settings,
            name=name,
            defaults={"order": idx, "is_active": True}
        )

    # 3. Food options
    food_data = [
        "Hot dishes",
        "Salads",
        "Appetizers",
        "Desserts",
    ]
    for idx, name in enumerate(food_data, start=1):
        CalculateFoodOption.objects.get_or_create(
            settings=settings,
            name=name,
            defaults={"order": idx, "is_active": True}
        )

    # 4. Steps ("How we work")
    steps_data = [
        {
            "step": "01",
            "title": "Enter your event details",
            "text": "Enter the guest count, event type and date in the form above. It takes less than a minute.",
            "order": 1,
        },
        {
            "step": "02",
            "title": "An estimate in 15 minutes",
            "text": "We will prepare 2-3 menu options for your budget free of charge and send them to your chosen messenger.",
            "order": 2,
        },
        {
            "step": "03",
            "title": "Confirm details and make a prepayment",
            "text": "We adjust the menu and services to your needs. A 30% prepayment secures the date.",
            "order": 3,
        },
        {
            "step": "04",
            "title": "Delivery and payment",
            "text": "We deliver the dishes on the requested date and time. Payment is made on site upon handover.",
            "order": 4,
        },
    ]
    for item in steps_data:
        CalculateStep.objects.get_or_create(
            settings=settings,
            step=item["step"],
            defaults={"title": item["title"], "text": item["text"], "order": item["order"], "is_active": True}
        )

    # 5. Link existing AdditionalService to settings
    AdditionalService.objects.filter(settings__isnull=True).update(settings=settings)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("menu_requests", "0009_alter_additionalservice_options_and_more"),
    ]

    operations = [
        migrations.RunPython(populate_calculate_data, reverse_code=noop),
    ]
