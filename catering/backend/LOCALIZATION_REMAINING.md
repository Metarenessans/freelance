# English localization verification

The historical task list below has now been resolved. First-party application prose,
admin labels, validation messages, notification templates, migration metadata and
seeded example content are in English. Legacy parsing/transliteration behavior is
preserved using explicit Unicode escapes only where necessary.

Verified: no pending model migrations; the full migration chain succeeds on the new
isolated Neon PostgreSQL database; 30 backend tests and 18 frontend tests pass;
Next.js 16.4.2 production build passes. The root publication test checks source text
for remaining literal Cyrillic. Original image backups were removed and recognizable
portraits/business covers replaced with neutral food-only demo imagery.

The public catalog uses new English sample data, not customer or original database
records. These checks do not certify third-party translations, all image rights or
future content entered through administration.

## Historical scope and task list (resolved)

Keep field names, Python identifiers, route paths, migration names/dependencies and
media filenames stable. Translation here must not modify the original repository.
Third-party collected `staticfiles` and retained media filenames are not included.

## Exact remaining paths and line numbers

- `backend/apps/blog/admin.py`: 37, 38, 73
- `backend/apps/blog/apps.py`: 7
- `backend/apps/blog/migrations/0001_initial.py`: 22, 24, 25, 26, 59, 60, 61, 62
- `backend/apps/blog/models.py`: 10, 14, 18, 20, 22, 58, 60, 62, 67, 68, 69, 70, 71, 72, 73, 74, 75, 87, 89, 90
- `backend/apps/blog/views.py`: 15, 32
- `backend/apps/catalog/admin.py`: 21, 22, 34, 42, 43, 94, 95, 96, 101, 104, 127, 158, 216, 222, 225
- `backend/apps/catalog/apps.py`: 7, 16, 28, 40, 49
- `backend/apps/catalog/filters.py`: 7, 8, 23
- `backend/apps/catalog/image_utils.py`: 13, 14, 22, 29, 53
- `backend/apps/catalog/management/commands/update_min_order.py`: 6, 26, 27, 28
- `backend/apps/catalog/migrations/0001_initial.py`: 19, 36, 40, 42, 64, 65
- `backend/apps/catalog/migrations/0002_productoption.py`: 19, 20, 25, 26
- `backend/apps/catalog/migrations/0003_product_min_order_quantity.py`: 16
- `backend/apps/catalog/migrations/0004_productoption_min_order_quantity.py`: 16
- `backend/apps/catalog/migrations/0006_section_category_section.py`: 18
- `backend/apps/catalog/migrations/0007_remove_category_section_section_categories.py`: 20
- `backend/apps/catalog/migrations/0008_section_image_section_image_url.py`: 21
- `backend/apps/catalog/migrations/0009_sectioncategory_through.py`: 63, 64, 80
- `backend/apps/catalog/migrations/0010_alter_category_slug_alter_section_slug.py`: 16, 21
- `backend/apps/catalog/migrations/0011_product_slug.py`: 16
- `backend/apps/catalog/migrations/0012_section_seo_description_section_seo_title.py`: 16, 21
- `backend/apps/catalog/mixins.py`: 10, 11, 14, 30, 35, 38, 47, 51, 58, 60
- `backend/apps/catalog/models.py`: 6, 10, 11, 12, 13, 14, 23, 24, 30, 31, 40, 46, 60, 61, 67, 92, 108, 109, 115, 116, 145, 146, 167, 168, 178, 179, 197, 198, 207, 208, 223, 224, 231, 251, 257, 264, 290, 306, 318, 325, 331, 337, 338
- `backend/apps/catalog/revalidate.py`: 15, 16, 17, 45
- `backend/apps/catalog/serializers.py`: 63, 64, 151
- `backend/apps/catalog/static/admin/css/sortable_custom.css`: 105, 148, 150, 174, 179
- `backend/apps/catalog/static/admin/js/char_counter.js`: 9, 10, 13, 14, 61, 65, 69, 73, 77, 83
- `backend/apps/catalog/static/admin/js/slug_auto_update.js`: 5, 6, 7, 8, 9, 34, 35, 46, 47, 54, 112
- `backend/apps/catalog/static/admin/js/sortable_inline_arrows.js`: 130, 156, 171, 188, 356, 369, 385
- `backend/apps/catalog/templates/admin/change_form_with_make_first.html`: 9
- `backend/apps/catalog/views.py`: 20, 56, 88, 145
- `backend/apps/company/admin.py`: 21, 34, 42, 46, 61, 67, 80, 87, 88, 89, 90, 106, 112, 118, 123, 127, 131, 150, 154, 155, 156, 157, 162, 166, 167, 172, 188, 192, 201, 212, 215, 224, 226, 238, 243, 248
- `backend/apps/company/doc_converter.py`: 12, 22, 76, 82
- `backend/apps/company/migrations/0001_initial.py`: 25, 26, 27, 28
- `backend/apps/company/migrations/0002_companyinfo_reviews_url.py`: 16
- `backend/apps/company/migrations/0003_footernavigation.py`: 19
- `backend/apps/company/migrations/0005_companyinfo_hero_image_bottom_and_more.py`: 16, 21
- `backend/apps/company/migrations/0006_companyinfo_hero_image_top_mobile.py`: 16
- `backend/apps/company/migrations/0007_companyinfo_latitude_companyinfo_longitude.py`: 16, 21
- `backend/apps/company/migrations/0008_companyinfo_city_companyinfo_legal_name_and_more.py`: 16, 21, 26, 31
- `backend/apps/company/migrations/0009_alter_companyinfo_city_alter_companyinfo_latitude_and_more.py`: 16, 21, 26, 31, 36, 41
- `backend/apps/company/migrations/0010_privacypolicy.py`: 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 54, 55, 56
- `backend/apps/company/migrations/0011_legaldocument.py`: 13, 14, 15, 16, 18, 19, 20, 22, 24, 25, 26, 27, 28, 30, 32, 33, 34, 36, 37, 38, 39, 52, 53, 54, 55, 56, 58, 59, 60, 61, 63, 65, 66, 80, 81, 82, 83, 85, 86, 88, 90, 91, 92, 94, 96, 97, 98, 100, 102, 103, 127, 128, 129, 130, 135, 136
- `backend/apps/company/migrations/0012_companyinfo_rkn_registry_number_and_more.py`: 16, 21
- `backend/apps/company/migrations/0013_companyinfo_og_image.py`: 16
- `backend/apps/company/models.py`: 7, 8, 16, 23, 32, 40, 47, 54, 62, 71, 77, 78, 85, 91, 97, 103, 109, 115, 121, 127, 128, 140, 163, 206, 207, 228, 229, 230, 231, 237, 243, 244, 249, 250, 285, 286, 287, 288, 299, 300, 305, 311, 312, 317, 318, 324, 325
- `backend/apps/company/views.py`: 26, 31, 36, 46, 47, 65, 66
- `backend/apps/faq/migrations/0001_initial.py`: 19
- `backend/apps/faq/models.py`: 6, 7, 12, 13
- `backend/apps/faq/views.py`: 10, 12, 13
- `backend/apps/faq/widgets.py`: 29, 75
- `backend/apps/menu_requests/admin.py`: 54, 60, 72, 78, 113, 115, 124, 126, 129, 136, 139, 142, 147, 172, 174, 176, 204, 215, 216, 227, 228, 240, 241, 253, 265, 281, 287, 293, 299
- `backend/apps/menu_requests/apps.py`: 7
- `backend/apps/menu_requests/migrations/0001_initial.py`: 18, 24, 25, 39, 50, 51, 54, 55, 56, 61, 62
- `backend/apps/menu_requests/migrations/0003_additionalservice_linked_product.py`: 18
- `backend/apps/menu_requests/migrations/0007_calculatepagesettings_alter_menurequest_options_and_more.py`: 18, 19, 20, 21, 22, 26, 27, 32, 39, 46
- `backend/apps/menu_requests/migrations/0008_populate_calculate_settings.py`: 10, 11, 12, 13, 14, 20, 21, 25, 26, 30, 31, 35, 36
- `backend/apps/menu_requests/migrations/0009_alter_additionalservice_options_and_more.py`: 16, 26, 31, 36, 41, 46, 52, 58, 59, 67, 68, 69, 76, 84, 90, 91, 99, 100, 101, 108
- `backend/apps/menu_requests/migrations/0010_populate_all_calculate_data.py`: 15, 16, 17, 28, 29, 33, 46, 60, 61, 66, 67, 72, 73, 78, 79
- `backend/apps/menu_requests/models.py`: 7, 9, 12, 13, 14, 18, 22, 23, 26, 30, 34, 35, 38, 41, 42, 46, 47, 50, 54, 55, 56, 60, 62, 67, 68, 71, 85, 86, 97, 105, 106, 112, 122, 131, 132, 133, 139, 148, 157, 162, 163, 172, 181, 186, 187, 205, 206, 207, 213, 222, 232, 238, 255, 264, 268, 269, 270, 271, 280, 281, 288, 297, 305, 310, 311, 315
- `backend/apps/menu_requests/serializers.py`: 44, 70, 71, 80, 91, 97, 104, 105
- `backend/apps/menu_requests/views.py`: 21, 23, 24, 25, 26, 58, 68, 91
- `backend/apps/orders/admin.py`: 89, 91, 100, 102, 105, 112, 115, 118, 120, 124, 131, 182, 183, 186, 188, 206, 207, 211, 220
- `backend/apps/orders/email.py`: 23, 28, 50, 129, 131, 170, 176, 178, 200, 244, 250, 274, 312, 316, 337, 385, 391
- `backend/apps/orders/migrations/0001_initial.py`: 20, 21, 22, 23, 24, 38, 39, 40, 41, 42, 44, 47, 48
- `backend/apps/orders/migrations/0003_order_cart_link.py`: 16
- `backend/apps/orders/migrations/0005_telegramsubscriber.py`: 17, 18, 19, 20, 25, 26
- `backend/apps/orders/migrations/0006_emailsubscriber.py`: 17, 18, 19, 24, 25
- `backend/apps/orders/models.py`: 7, 9, 10, 11, 12, 16, 17, 18, 19, 20, 21, 49, 55, 60, 73, 78, 94, 95, 108, 110, 111, 113, 116, 118, 120, 124, 125, 140, 141, 147, 148, 155, 160, 166, 167, 175, 177, 178, 186, 192, 193, 198, 204, 205, 208
- `backend/apps/orders/serializers.py`: 31, 32, 44, 58, 71, 77, 100
- `backend/apps/orders/telegram.py`: 37, 38, 49, 51, 53, 54, 57, 59, 62, 130, 133, 141, 143, 189, 191, 213, 262
- `backend/apps/orders/views.py`: 19, 21, 22, 23, 24, 25, 56
- `backend/apps/system_settings/admin.py`: 18, 27, 28, 29, 34, 47, 48, 49, 50, 55, 59, 60, 61, 66, 70, 71, 72, 90, 92, 96, 104, 106, 110, 134, 137, 154, 172, 173, 174, 175, 176, 179, 188, 193, 201, 228, 232, 233, 238, 242, 243, 257
- `backend/apps/system_settings/migrations/0001_initial.py`: 18
- `backend/apps/system_settings/migrations/0002_systemsettings_sitemap_cache_minutes.py`: 16
- `backend/apps/system_settings/migrations/0003_systemsettings_default_from_email_and_more.py`: 16, 21, 26, 31, 36, 41, 46, 51, 56, 61, 66, 71
- `backend/apps/system_settings/migrations/0004_systemsettings_enable_debug_json_file.py`: 16
- `backend/apps/system_settings/migrations/0005_seosettings.py`: 17, 18, 19, 20
- `backend/apps/system_settings/migrations/0006_alter_systemsettings_frontend_url_and_more.py`: 16, 21
- `backend/apps/system_settings/models.py`: 8, 10, 13, 14, 18, 19, 22, 27, 28, 34, 35, 41, 42, 45, 50, 51, 55, 56, 60, 64, 70, 71, 77, 78, 84, 85, 88, 93, 94, 100, 101, 157, 159, 163, 164, 165, 169, 170, 171, 174, 178, 179, 180, 184, 185, 186
- `backend/apps/system_settings/static/admin/js/char_counter.js`: 9, 10, 13, 14, 61, 65, 69, 73, 77, 83
- `backend/apps/system_settings/utils.py`: 11, 18, 24, 25, 38, 50, 60, 75, 88, 116, 117, 127
- `backend/apps/system_settings/views.py`: 8, 19
- `backend/catering_backend/settings.py`: 127, 170, 171, 172
- `backend/catering_backend/urls.py`: 21, 54
- `backend/templates/admin/orders/emailsubscriber/change_list.html`: 7
- `backend/templates/admin/orders/emailsubscriber/check_smtp.html`: 6, 7, 10, 13, 18, 19, 26, 35, 38, 41, 54, 55, 60, 63, 66, 71, 72, 76, 79, 81, 82, 83, 92, 98, 105
- `backend/templates/admin/submit_line.html`: 5, 8, 12, 16, 28
