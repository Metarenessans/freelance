"""Catalog-only curation must preserve source associations and customer history."""
import hashlib
import json
import copy
import tempfile
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command, CommandError
from django.test import TestCase, override_settings
from apps.catalog.models import Category, Product, ProductExtraInfo, ProductOption, Section, SectionCategory
from apps.company.models import CompanyInfo
from apps.orders.models import Order, OrderItem, EmailSubscriber
from apps.system_settings.models import SystemSettings, SeoSettings

FIXTURE = Path(settings.BASE_DIR) / 'apps/catalog/fixtures/portfolio_catalog.json'


class CuratedCatalogTests(TestCase):
    def test_source_price_and_original_photo_associations(self):
        self.assertTrue(FIXTURE.is_file(), 'A safe curated fixture is required')
        data = json.loads(FIXTURE.read_text(encoding='utf8'))
        self.assertEqual(len(data['sections']), 5)
        self.assertEqual(sum(len(g['products']) for g in data['sections']), 60)
        self.assertEqual({g['source_category_id'] for g in data['sections']}, {31, 32, 36, 37, 42})
        call_command('load_portfolio_data', verbosity=0)
        source_ids = set()
        source_sections = set()
        for section in data['sections']:
            self.assertEqual(len(section['products']), 12)
            self.assertIs(type(section['source_section_id']), int)
            self.assertNotIn(section['source_section_id'], source_sections)
            source_sections.add(section['source_section_id'])
            actual_section = Section.objects.get(slug=section['slug'])
            self.assertEqual(actual_section.image.name, section['image'])
            self.assertEqual(actual_section.image_url, '')
            self.assertEqual(list(actual_section.categories.values_list('slug', flat=True)), [section['category_slug']])
            self.assertEqual(hashlib.sha256((Path(settings.MEDIA_ROOT) / section['image']).read_bytes()).hexdigest(), section['image_sha256'])
            if section['source_section_id'] == 4:
                self.assertEqual(section['source_category_id'], 32)
                self.assertEqual(section['image'], 'products/boks_kanape_xl_50_sht.webp')
            else:
                self.assertTrue(section['image'].startswith('sections/'))
            for row in section['products']:
                self.assertNotIn(row['source_id'], source_ids)
                source_ids.add(row['source_id'])
                product = Product.objects.get(slug=row['slug'])
                self.assertTrue(product.is_active)
                self.assertEqual(product.category.slug, section['category_slug'])
                self.assertEqual(product.old_price, Decimal(row['old_price']) if row['old_price'] is not None else None)
                self.assertEqual(product.min_order_quantity, row['min_order_quantity'])
                self.assertEqual(product.price, Decimal(row['price']))
                self.assertEqual(product.description, row['description'])
                self.assertEqual(product.name, row['name'])
                self.assertEqual(product.image.name, row['image'])
                self.assertEqual(product.image_url, '')
                self.assertTrue(product.effective_image_url.startswith('/media/products/'))
                self.assertEqual(hashlib.sha256((Path(settings.MEDIA_ROOT) / row['image']).read_bytes()).hexdigest(), row['image_sha256'])
                actual = list(product.options.filter(is_active=True).values_list('name', 'price', 'min_order_quantity'))
                expected = [(o['name'], Decimal(o['price']), o['min_order_quantity']) for o in row['options'] if o['is_active']]
                self.assertEqual(actual, expected)
        self.assertEqual(len(source_ids), 60)
        self.assertIn(4, source_sections)
        self.assertEqual(list(Product.objects.filter(is_active=True).order_by('order').values_list('order', flat=True)), list(range(60)))
        # Independent pinned source values: product base price differs from its options.
        prawns = Product.objects.get(slug='portfolio-367')
        self.assertEqual(prawns.price, Decimal('3990.00'))
        self.assertEqual(list(prawns.options.values_list('price', flat=True)), [Decimal('4990.00'), Decimal('3490.00')])
        self.assertEqual(Product.objects.get(slug='portfolio-171').price, Decimal('200.00'))
        self.assertEqual(Product.objects.get(slug='portfolio-459').price, Decimal('2990.00'))
        self.assertNotRegex(FIXTURE.read_text(encoding='utf8'), r'https?://|<script|[\u0400-\u04ff]|@')

    def test_seed_preserves_history_and_does_not_touch_other_domains(self):
        owner = get_user_model().objects.create_user(username='portfolio-owner', password='test-only', is_staff=True, is_superuser=True)
        owner_before = get_user_model().objects.filter(pk=owner.pk).values().get()
        category = Category.objects.create(slug='stale', name='Stale')
        stale = Product.objects.create(slug='stale', name='Old demo', price='99.00', category=category)
        stale_option = ProductOption.objects.create(product=stale, name='Old option', price='99.00')
        stale_extra = ProductExtraInfo.objects.create(product=stale, amount='1', unit='piece')
        old_section = Section.objects.create(slug='stale', name='Old section')
        SectionCategory.objects.create(section=old_section, category=category)
        company = CompanyInfo.load()
        CompanyInfo.objects.filter(pk=company.pk).update(company_name='Neutral existing brand')
        company_before = CompanyInfo.objects.filter(pk=company.pk).values().get()
        order = Order.objects.create(name='Test customer', total_price='99', final_price='99')
        item = OrderItem.objects.create(order=order, product=stale, product_name='Old demo', price='99', quantity=1, subtotal='99')
        subscriber = EmailSubscriber.objects.create(email='fixture-test@example.invalid')
        before = (Order.objects.get(pk=order.pk).__dict__.copy(), OrderItem.objects.get(pk=item.pk).__dict__.copy())
        settings_before = []
        for model in (SystemSettings, SeoSettings):
            model.load()
            settings_before.append(list(model.objects.values()))
        call_command('load_portfolio_data', verbosity=0)
        call_command('load_portfolio_data', verbosity=0)
        stale.refresh_from_db()
        self.assertFalse(stale.is_active)
        stale_option.refresh_from_db()
        self.assertFalse(stale_option.is_active)
        stale_extra.refresh_from_db()
        self.assertFalse(stale_extra.is_active)
        self.assertEqual(OrderItem.objects.get(pk=item.pk).product_id, stale.pk)
        for original, actual in zip(before, (Order.objects.get(pk=order.pk).__dict__, OrderItem.objects.get(pk=item.pk).__dict__)):
            original.pop('_state')
            actual.pop('_state')
            self.assertEqual(original, actual)
        self.assertTrue(EmailSubscriber.objects.filter(pk=subscriber.pk).exists())
        self.assertEqual(CompanyInfo.objects.get(pk=company.pk).company_name, 'Neutral existing brand')
        self.assertEqual(CompanyInfo.objects.filter(pk=company.pk).values().get(), company_before)
        self.assertEqual(get_user_model().objects.filter(pk=owner.pk).values().get(), owner_before)
        for model, snapshot in zip((SystemSettings, SeoSettings), settings_before):
            self.assertEqual(list(model.objects.values()), snapshot)
        category.refresh_from_db()
        old_section.refresh_from_db()
        self.assertFalse(category.is_active)
        self.assertFalse(old_section.is_active)
        self.assertEqual(Product.objects.filter(is_active=True).count(), 60)
        self.assertEqual(Category.objects.filter(is_active=True).count(), 5)
        self.assertEqual(Section.objects.filter(is_active=True).count(), 5)


class CuratedPreflightTests(TestCase):
    """Synthetic metadata exercises rejection paths, not production-photo provenance."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.data = json.loads(FIXTURE.read_text(encoding='utf8'))
        photo = (Path(settings.MEDIA_ROOT) / self.data['sections'][0]['products'][0]['image']).read_bytes()
        for index, group in enumerate(self.data['sections']):
            group['source_section_id'] = 4 if group['source_category_id'] == 32 else 100 + index
            group['image'] = ('products/boks_kanape_xl_50_sht.webp' if group['source_section_id'] == 4
                              else f'sections/regression-{index}.webp')
            group['image_sha256'] = hashlib.sha256(photo).hexdigest()
            target = self.root / group['image']
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(photo)
            while len(group['products']) < 12:
                row = copy.deepcopy(group['products'][0])
                row['source_id'] = 10000 + index * 12 + len(group['products'])
                row['slug'] = f"regression-{row['source_id']}"
                group['products'].append(row)
        self.fixture = self.root / 'catalog.json'

    def seed(self):
        self.fixture.write_text(json.dumps(self.data), encoding='utf8')
        # Image transformation is outside this metadata-only regression. Real-media
        # provenance and hashes are exercised without this patch in CuratedCatalogTests.
        with (patch('apps.catalog.management.commands.load_portfolio_data.FIXTURE_PATH', self.fixture),
              override_settings(MEDIA_ROOT=self.root),
              patch('apps.catalog.signals.optimize_image_to_webp')):
            call_command('load_portfolio_data', verbosity=0)

    def test_group_photo_is_used_instead_of_first_product_photo(self):
        self.seed()
        for group in self.data['sections']:
            self.assertEqual(Section.objects.get(slug=group['slug']).image.name, group['image'])
        self.assertEqual(Product.objects.filter(is_active=True).count(), 60)

    def test_invalid_group_photos_are_rejected_before_catalog_changes(self):
        original = copy.deepcopy(self.data)
        bad_values = [None, '', '../outside.webp', '/sections/photo.webp',
                      'sections/../products/photo.webp', 'sections\\photo.webp',
                      'C:/sections/photo.webp', 'https://example.invalid/photo.webp',
                      'products/not-the-legacy-photo.webp', 'sections//photo.webp',
                      'sections/./photo.webp', 'sections/missing.webp']
        stale = Category.objects.create(slug='preflight-stale', name='Untouched')
        for value in bad_values:
            with self.subTest(image=value):
                self.data = copy.deepcopy(original)
                self.data['sections'][0]['image'] = value
                with self.assertRaises(CommandError):
                    self.seed()
                self.assertEqual(Category.objects.count(), 1)
                stale.refresh_from_db()
                self.assertTrue(stale.is_active)
                self.assertFalse(Section.objects.exists())
        for field, value in [('image', None), ('image_sha256', None), ('image_sha256', 'bad'),
                             ('image_sha256', '0' * 64), ('source_section_id', '4')]:
            with self.subTest(field=field, value=value):
                self.data = copy.deepcopy(original)
                if value is None:
                    del self.data['sections'][0][field]
                else:
                    self.data['sections'][0][field] = value
                with self.assertRaises(CommandError):
                    self.seed()
                self.assertFalse(Product.objects.exists())

    def test_legacy_product_photo_is_allowed_only_for_source_section_four(self):
        self.data['sections'][0]['image'] = 'products/boks_kanape_xl_50_sht.webp'
        with self.assertRaises(CommandError):
            self.seed()

    def test_old_forty_five_product_fixture_is_rejected(self):
        for group in self.data['sections']:
            group['products'] = group['products'][:9]
        with self.assertRaisesMessage(CommandError, '12 products (60 total)'):
            self.seed()
        self.assertFalse(Product.objects.exists())

    def test_unsafe_product_paths_are_rejected(self):
        for image in ('', '../outside.webp', 'products/../outside.webp',
                      'products\\outside.webp', '/products/photo.webp', 'products//photo.webp'):
            with self.subTest(image=image):
                self.data['sections'][0]['products'][0]['image'] = image
                with self.assertRaises(CommandError):
                    self.seed()
                self.assertFalse(Product.objects.exists())

    def test_group_count_and_duplicate_products_are_rejected(self):
        original = copy.deepcopy(self.data)
        for mutation in ('eleven', 'thirteen', 'duplicate_id', 'duplicate_slug', 'duplicate_section', 'wrong_category'):
            with self.subTest(mutation=mutation):
                self.data = copy.deepcopy(original)
                groups = self.data['sections']
                if mutation == 'eleven':
                    groups[0]['products'].pop()
                elif mutation == 'thirteen':
                    groups[0]['products'].append(copy.deepcopy(groups[0]['products'][0]))
                elif mutation in ('duplicate_id', 'duplicate_slug'):
                    key = 'source_id' if mutation == 'duplicate_id' else 'slug'
                    groups[1]['products'][0][key] = groups[0]['products'][0][key]
                elif mutation == 'duplicate_section':
                    groups[1]['source_section_id'] = groups[0]['source_section_id']
                else:
                    groups[0]['source_category_id'] = 999
                with self.assertRaises(CommandError):
                    self.seed()
                self.assertFalse(Product.objects.exists())
