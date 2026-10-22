import hashlib
from pathlib import Path

from django.core.management import call_command
from django.test import TestCase
from apps.catalog.models import Section, Product


class PortfolioSeedTests(TestCase):
    def test_portfolio_seed_has_exactly_five_disjoint_twelve_product_sections(self):
        call_command('load_portfolio_data', verbosity=0)
        self.assertEqual(Section.objects.filter(is_active=True).count(), 5)
        self.assertEqual(Product.objects.filter(is_active=True).count(), 60)
        seen = set()
        for section in Section.objects.filter(is_active=True):
            ids = set(Product.objects.filter(category__sections=section, is_active=True).values_list('pk', flat=True))
            self.assertEqual(len(ids), 12)
            self.assertFalse(seen & ids)
            seen |= ids
        self.assertEqual(len(seen), 60)
        for section in Section.objects.filter(is_active=True):
            self.assertTrue(section.categories.filter(is_active=True).exists())


    def test_hero_uses_the_original_food_only_photo(self):
        expected = '10bc1dcc74412a9937d2e5bb4a8bae05bfef529c8bbb4229761267a9e752ab84'
        for name in ('demo-spread.webp', 'demo-mobile.webp'):
            actual = hashlib.sha256((Path(__file__).parent / 'media/hero' / name).read_bytes()).hexdigest()
            self.assertEqual(actual, expected)

    def test_seed_is_idempotent(self):
        call_command('load_portfolio_data', verbosity=0)
        expected = (Product.objects.count(), Section.objects.count())
        call_command('load_portfolio_data', verbosity=0)
        self.assertEqual((Product.objects.count(), Section.objects.count()), expected)
