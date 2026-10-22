import re
from django.core.management.base import BaseCommand
from ...models import Product, Category

class Command(BaseCommand):
    help = "Parse product names in specific categories and update their min_order_quantity based on the legacy Russian 'from X pcs' pattern"

    def handle(self, *args, **options):
        # Target category slugs
        target_slugs = ["piece-bruschetta-crostini", "piece-canapes"]
        
        categories = Category.objects.filter(slug__in=target_slugs)
        if not categories.exists():
            self.stdout.write(self.style.WARNING(f"No categories found with slugs: {target_slugs}"))
            return

        self.stdout.write(f"Found categories: {[c.name for c in categories]}")
        
        # Query all products in these categories
        products = Product.objects.filter(category__in=categories)
        self.stdout.write(f"Total products in these categories: {products.count()}")

        updated_count = 0
        for product in products:
            name = product.name
            # Match the legacy Russian 'from X' or 'from X pcs' pattern
            # Match the legacy Russian 'from' token, whitespace, and digits, case-insensitively.
            match = re.search(r'(?i)\b\u043e\u0442\s+(\d+)', name)
            
            if match:
                min_qty = int(match.group(1))
                product.min_order_quantity = min_qty
                product.save(update_fields=['min_order_quantity'])
                self.stdout.write(self.style.SUCCESS(
                    f"UPDATED: '{name}' (ID: {product.id}) -> minOrderQuantity = {min_qty}"
                ))
                updated_count += 1
            else:
                self.stdout.write(self.style.NOTICE(
                    f"SKIPPED (no pattern): '{name}' (ID: {product.id})"
                ))

        self.stdout.write(self.style.SUCCESS(f"Finished updating. Total updated: {updated_count} products."))
