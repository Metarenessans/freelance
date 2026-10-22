"""Load the curated food-only English catalog without touching customer history."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
from django.conf import settings
from django.core.management import BaseCommand, CommandError
from django.db import transaction
from apps.catalog.models import (
    Category, Product, ProductExtraInfo, ProductOption, Section, SectionCategory,
)

FIXTURE_PATH = Path(__file__).resolve().parents[2] / 'fixtures' / 'portfolio_catalog.json'


class Command(BaseCommand):
    help = 'Upsert 5 sections of 12 original food products; deactivate stale catalog rows, never delete orders'

    @staticmethod
    def validate_image_path(value, directory):
        if not isinstance(value, str) or not re.fullmatch(r'[A-Za-z0-9_./-]+', value):
            raise CommandError('Images must be safe relative local media paths.')
        path = PurePosixPath(value)
        if (path.is_absolute() or '..' in path.parts or len(path.parts) < 2
                or path.parts[0] != directory or str(path) != value):
            raise CommandError('Images must be safe relative local media paths.')
        return path

    @transaction.atomic
    def handle(self, *args, **options):
        if os.getenv('DEMO_MODE', 'true').lower() != 'true':
            raise CommandError('Portfolio seeding requires DEMO_MODE=true.')
        try:
            data = json.loads(FIXTURE_PATH.read_text(encoding='utf8'))
            groups = data['sections']
            products = [p for group in groups for p in group['products']]
            if (len(groups) != 5 or any(len(g['products']) != 12 for g in groups)
                    or len({p['source_id'] for p in products}) != 60
                    or len({p['slug'] for p in products}) != 60
                    or len({g['slug'] for g in groups}) != 5
                    or len({g['category_slug'] for g in groups}) != 5
                    or {g['source_category_id'] for g in groups} != {31, 32, 36, 37, 42}
                    or any(type(g['source_section_id']) is not int or g['source_section_id'] <= 0 for g in groups)
                    or len({g['source_section_id'] for g in groups}) != 5
                    or not any(g['source_section_id'] == 4 and g['source_category_id'] == 32 for g in groups)):
                raise CommandError('Curated catalog must contain exactly 5 disjoint groups of 12 products (60 total) with original source associations.')
        except (OSError, ValueError, KeyError, TypeError) as exc:
            raise CommandError('Invalid curated catalog schema or unreadable fixture.') from exc
        # Fail closed if the reviewed text or local image paths are replaced with unsafe data.
        if re.search(r'https?://|<|>|@|[\u0400-\u04ff]', json.dumps(data, ensure_ascii=False)):
            raise CommandError('Curated fixture must contain safe English text and local images only.')
        for p in products:
            self.validate_image_path(p.get('image'), 'products')
        media_root = Path(settings.MEDIA_ROOT).resolve()
        for group in groups:
            image = group.get('image')
            if group['source_section_id'] == 4:
                if image != 'products/boks_kanape_xl_50_sht.webp':
                    raise CommandError('Source section 4 must use its original local canape box photo.')
                self.validate_image_path(image, 'products')
            else:
                self.validate_image_path(image, 'sections')
            expected_hash = group.get('image_sha256')
            if not isinstance(expected_hash, str) or not re.fullmatch(r'[0-9a-f]{64}', expected_hash):
                raise CommandError('Section images require a SHA-256 digest.')
            try:
                local_image = (media_root / image).resolve()
                if not local_image.is_relative_to(media_root):
                    raise CommandError('Section image must remain inside local media.')
                actual_hash = hashlib.sha256(local_image.read_bytes()).hexdigest()
            except OSError as exc:
                raise CommandError(f'Section image is missing or unreadable: {image}') from exc
            if actual_hash != expected_hash:
                raise CommandError(f'Section image SHA-256 mismatch: {image}')
        product_ids, category_ids, section_ids, option_ids, extra_ids = [], [], [], [], []
        for order, group in enumerate(groups):
            category, _ = Category.objects.update_or_create(
                slug=group['category_slug'], defaults={'name': group['name'], 'order': order, 'is_active': True})
            section, _ = Section.objects.update_or_create(slug=group['slug'], defaults={
                'name': group['name'], 'order': order, 'is_active': True,
                'image': group['image'], 'image_url': '',
                'seo_title': group['name'] + ' | Catering Portfolio Demo',
                'seo_description': 'Explore the original food selection in this English portfolio catalog.',
            })
            # Only obsolete membership links are removed, never a category/product/customer row.
            SectionCategory.objects.filter(section=section).exclude(category=category).delete()
            SectionCategory.objects.update_or_create(section=section, category=category, defaults={'order': 0})
            category_ids.append(category.pk)
            section_ids.append(section.pk)
            for product_order, row in enumerate(group['products']):
                product, _ = Product.objects.update_or_create(slug=row['slug'], defaults={
                    'name': row['name'], 'description': row['description'], 'category': category,
                    'price': row['price'], 'old_price': row['old_price'],
                    'min_order_quantity': row['min_order_quantity'], 'image': row['image'], 'image_url': '',
                    'is_active': True, 'is_featured': product_order == 0, 'order': order * 12 + product_order,
                })
                product_ids.append(product.pk)
                for option in row['options']:
                    obj, _ = ProductOption.objects.update_or_create(product=product, name=option['name'], defaults={
                        key: option[key] for key in ('price', 'old_price', 'min_order_quantity', 'order', 'is_active')})
                    option_ids.append(obj.pk)
                for extra in row['extra_info']:
                    obj, _ = ProductExtraInfo.objects.update_or_create(
                        product=product, amount=extra['amount'], unit=extra['unit'],
                        defaults={'order': extra['order'], 'is_active': extra['is_active']})
                    extra_ids.append(obj.pk)
        Product.objects.exclude(pk__in=product_ids).update(is_active=False)
        Category.objects.exclude(pk__in=category_ids).update(is_active=False)
        Section.objects.exclude(pk__in=section_ids).update(is_active=False)
        ProductOption.objects.exclude(pk__in=option_ids).update(is_active=False)
        ProductExtraInfo.objects.exclude(pk__in=extra_ids).update(is_active=False)
        blog_fixture = Path(__file__).resolve().parents[2] / 'fixtures' / 'portfolio_blog.json'
        if blog_fixture.is_file():
            try:
                from apps.blog.models import BlogArticle, BlogArticleBlock
                blog_data = json.loads(blog_fixture.read_text(encoding='utf8'))
                for art in blog_data.get('articles', []):
                    article, _ = BlogArticle.objects.update_or_create(
                        slug=art['slug'],
                        defaults={
                            'title': art['title'],
                            'cover': art.get('cover') or '',
                            'is_cover_like_block_image': art.get('is_cover_like_block_image', False),
                            'cover_alt': art.get('cover_alt'),
                            'cover_source_link': art.get('cover_source_link'),
                            'created_date': art.get('created_date'),
                            'is_published': art.get('is_published', True),
                            'seo_title': art.get('seo_title'),
                            'seo_description': art.get('seo_description'),
                        }
                    )
                    article.blocks.all().delete()
                    for blk in art.get('blocks', []):
                        BlogArticleBlock.objects.create(
                            article=article,
                            order=blk.get('order', 0),
                            image=blk.get('image') or '',
                            image_alt=blk.get('image_alt'),
                            image_source_link=blk.get('image_source_link'),
                            image_height_unlimited=blk.get('image_height_unlimited', False),
                            text=blk.get('text', ''),
                        )
            except Exception as exc:
                self.stdout.write(self.style.WARNING(f'Blog article seeding skipped: {exc}'))
        self.stdout.write(self.style.SUCCESS('Curated English catalog ready: 5 sections, 12 products each, 60 total. Customer data unchanged.'))
