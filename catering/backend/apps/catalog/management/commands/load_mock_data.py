from django.core.management.base import BaseCommand
from ...models import Category, Product, ProductExtraInfo
from ....faq.models import FaqItem
from ....company.models import CompanyInfo
from ....menu_requests.models import EventFormat, AdditionalService

class Command(BaseCommand):
    help = 'Load English demonstration catalog data only; never load customers or orders'

    def handle(self, *args, **kwargs):
        self.stdout.write('Loading categories...')
        categories_data = [
            {"slug": "profitable", "name": "Special offers🔥"},
            {"slug": "kids-menu", "name": "Kids menu"},
            {"slug": "premium-boxes", "name": "Premium boxes"},
            {"slug": "assorted-snacks", "name": "Appetizer assortment"},
            {"slug": "bruschetta-crostini-tapas", "name": "Bruschetta, crostini and tapas"},
            {"slug": "canapes", "name": "Canapes"},
            {"slug": "piece-bruschetta-crostini", "name": "Individual bruschetta and crostini"},
            {"slug": "piece-canapes", "name": "Individual canapes"},
            {"slug": "tartlets-profiteroles", "name": "Tartlets and profiteroles"},
            {"slug": "rolls", "name": "Rolls"},
            {"slug": "juliennes", "name": "Juliennes"},
            {"slug": "salads", "name": "Salads"},
            {"slug": "hot", "name": "Hot dishes"},
            {"slug": "gastro-travel", "name": "Food journey"},
            {"slug": "menu-options", "name": "Menu options"},
            {"slug": "soups", "name": "Soups and broths"},
            {"slug": "brunches", "name": "Brunch and platters"},
            {"slug": "pancake-boxes", "name": "Pancake boxes"},
            {"slug": "snacks-cups", "name": "Appetizer cups"},
            {"slug": "desserts", "name": "Desserts"},
            {"slug": "romantic", "name": "Dinner for two"},
            {"slug": "pies", "name": "Pies and spreads"},
            {"slug": "services", "name": "Services"},
        ]
        
        for i, c_data in enumerate(categories_data):
            Category.objects.update_or_create(
                slug=c_data["slug"],
                defaults={"name": c_data["name"], "order": i}
            )

        self.stdout.write('Loading products...')
        products_data = [
            {
                "category_slug": "profitable",
                "image_url": "/media/products/boks_assorti_30sht.webp",
                "name": "Demo appetizer assortment",
                "extraInfo": [{"amount": 50, "unit": "pcs"}, {"amount": 1200, "unit": "g"}],
                "price": 6900,
                "oldPrice": 12000,
                "description": "Demonstration appetizer assortment. Not a live commercial offer."
            },
            {
                "category_slug": "kids-menu",
                "image_url": "/media/products/boks_brusketty_16sht.webp",
                "name": "Demo kids appetizer box",
                "extraInfo": [{"amount": 20, "unit": "pcs"}, {"amount": 500, "unit": "g"}],
                "price": 3500,
            },
            {
                "category_slug": "premium-boxes",
                "image_url": "/media/products/fruktovyy_boks.webp",
                "name": "Demo premium assortment",
                "extraInfo": [{"amount": 80, "unit": "pcs"}, {"amount": 2000, "unit": "g"}],
                "price": 12000,
            },
        ]
        
        for i, p_data in enumerate(products_data):
            category = Category.objects.filter(slug=p_data["category_slug"]).first()
            prod, _ = Product.objects.update_or_create(
                name=p_data["name"],
                defaults={
                    "category": category,
                    "image_url": p_data["image_url"],
                    "price": p_data["price"],
                    "old_price": p_data.get("oldPrice"),
                    "description": p_data.get("description", ""),
                    "order": i,
                    "is_featured": p_data["category_slug"] == "profitable",
                }
            )
            prod.extra_info.all().delete()
            for extra in p_data.get("extraInfo", []):
                ProductExtraInfo.objects.create(
                    product=prod,
                    amount=extra["amount"],
                    unit=extra["unit"]
                )

        self.stdout.write('Loading FAQs...')
        faq_data = [
            {
                "question": "Delivery",
                "answerItems": [
                    "Demo delivery offer; confirm current terms before ordering",
                    "Demo delivery information; contact the operator for availability",
                ]
            },
            {
                "question": "Halal ",
                "answerItems": ["Halal options and ingredient substitutions available on request"]
            },
        ]
        
        for i, faq in enumerate(faq_data):
            FaqItem.objects.update_or_create(
                question=faq["question"],
                defaults={"answer_items": faq["answerItems"], "order": i}
            )

        self.stdout.write('Loading company info...')
        CompanyInfo.load()

        self.stdout.write('Loading Event Formats & Additional Services...')
        formats = [
            "Anniversary", "Wedding", "Buffet", "Corporate event", "Kids party", "Delivery", "Pickup", "Other"
        ]
        for i, fmt in enumerate(formats):
            EventFormat.objects.update_or_create(name=fmt, defaults={"order": i})

        services = [
            {"id": "1", "label": "On-site table setup"},
            {"id": "2", "label": "Waitstaff"},
            {"id": "3", "label": "Tableware rental"},
            {"id": "4", "label": "Furniture rental"},
        ]
        for i, svc in enumerate(services):
            AdditionalService.objects.update_or_create(label=svc["label"], defaults={"order": i})

        self.stdout.write(self.style.SUCCESS('Successfully loaded mock data.'))
