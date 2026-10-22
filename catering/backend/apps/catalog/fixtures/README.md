# Curated portfolio catalog

`portfolio_catalog.json` is a food-only, reviewed English fixture, not a database dump or Django `loaddata` export. Load it with `python manage.py load_portfolio_data` in the isolated portfolio deployment (`DEMO_MODE=true`). Loading the bundled fixture requires no production access.

## Live source and selection

This revision uses the authorized **current live production catalog-only export**, acquired separately through SSH using **read-only SQL** (`read_only=on`). The older SQL dump is not the source for this revision. Only catalog sections, categories, memberships, products, options and extra information were considered. No users, orders, settings, credentials or customer data are included. Updating this fixture did not connect to production or SSH.

Exactly **5 sections × 12 distinct active products = 60 products**, across five disjoint categories. There are **26 source options** (all active), attached to 11 products, and no selected extra-information rows. The previous 45 products retain their stable slugs and reviewed English names/descriptions matching the live text; 15 products have been added. Existing section/category slugs remain stable. Source IDs are provenance identifiers, not destination database primary keys.

| Source category | Source section | English section | Selected source product IDs, in fixture order |
| --- | --- | --- | --- |
| 31 | 2 | Bruschetta & croissants | 171, 173, 175, 185, 187, 191, 200, 203, 499, 169, 170, 172 |
| 32 | 4 | Canapés & bites | 210, 211, 212, 234, 236, 238, 239, 242, 251, 244, 227, 228 |
| 36 | 6 | Salads | 303, 307, 308, 314, 317, 319, 324, 328, 343, 304, 305, 306 |
| 37 | 7 | Hot dishes | 347, 352, 354, 359, 362, 369, 375, 350, 367, 345, 346, 348 |
| 42 | 10 | Desserts | 440, 436, 447, 453, 459, 456, 452, 438, 443, 435, 439, 441 |

Names, descriptions and option labels are plain English, with no HTML, scripts, contacts or external service URLs. Empty source descriptions remain empty. No ingredients, prices or minimum quantities were invented. Option 146 remains “Option 1” because its source label provides no further detail.

## Production photo mappings

The fixture references exactly **60 product photographs plus 5 section photo mappings**. Product paths and SHA-256 values match the live media manifest; section mappings reference the actual production section photographs. Media acquisition and copying are handled separately: changing this fixture does not fetch, modify or visually certify media.

| Source section | Local media-relative image path | SHA-256 |
| --- | --- | --- |
| 2 | `sections/brusketta_s_krevetkami_na_musse_avokado_ot_6sht.webp` | `0549221824c33808fdc2d91c40d357ad0da5396408ca429e29712dc8b8262acc` |
| 4 | `products/boks_kanape_xl_50_sht.webp` | `8a9599e7776751228b3a6a4cb1f08201ee1fd63516db1264dc8deb0b1f405c12` |
| 6 | `sections/salaty_hd.webp` | `145efe4f35348c04cbbfe48c8e68aa4d4fc8809d445e363ed8847b92279a414d` |
| 7 | `sections/goryachee_hd.webp` | `85ff99564d4543a84eec07e3dd2da25f5dc88f70a1065c2e557f294b91e2d09c` |
| 10 | `sections/deserty_hd.webp` | `8af240a5d86a80c1ffb61c7c4f07bb290711db2ef021b54c128810a3efcd1c35` |

Section 4 has an empty uploaded-image field in production and a legacy image URL pointing to the canapé box photograph. Its mapping uses only the local media-relative path above; the service URL is deliberately omitted. Its SHA-256 was computed from the existing local copy; the separate media import must verify it against the production file. No external image URL is retained in the fixture.

## Authentic pricing and reconciliation

All structured base prices, old prices, minimum quantities, option prices, option minimums, option ordering and active flags match the live export. Currency remains **RUB, without conversion**. Source inconsistencies are documented rather than silently corrected.

Compared with the previous 45-product fixture, **25 base prices changed**: 171, 173, 175, 187, 203, 499, 210, 211, 212, 236, 238, 251, 303, 308, 314, 317, 319, 328, 343, 352, 354, 350, 453, 438 and 443. Existing structured minimums, old prices and the 16 previously selected option records are unchanged. The 15 added products contribute 10 further options (169: four; 170: four; 435: two). The original 45 English product names and descriptions still match the live text and were preserved.

### Source discrepancies intentionally retained

- Berry croissants (203): title minimum 8; structured minimum 6.
- Profiteroles (447): title minimum 10; structured minimum 12.
- Fruit canapés (251): title minimum 12; individual option label minimum 10; structured product and option minimums are null. Base price 220 RUB differs from individual option price 190 RUB.
- Brie canapés (238): description quotes tasting boats at 160 RUB per piece; actual tasting-boat option 170 RUB. Base price is now 170 RUB; the other option remains 150 RUB.
- Caesar bruschetta (175): base 200 RUB; chicken and prawn options 180 and 190 RUB. These are independent source values, not a calculated minimum.
- Chicken Caesar salad bowl (319): base 1900 RUB; “Option 1” 1800 RUB; prawn option 1900 RUB.
- Panko langoustines (367): base 3990 RUB; 30-piece option 4990 RUB; 20-piece option 3490 RUB. The title says langoustines while the description says prawns; both translations retain that distinction.
- Berry dessert baskets (435): base 3990 RUB; 16-piece box option 3490 RUB; individual option 220 RUB, structured minimum 8.
- Some title weights differ from approximate description weights, including Mushroom Glade salad (303) and the 1000 g salad rolls. Both source values are preserved.
- Source filenames or source slugs may contain obsolete quantities. They are not treated as structured minimums; existing public slugs and exact media references remain stable.

## Deployment boundary

This fixture is catalog-only and must not be loaded through a broad database restore. Production acquisition, media verification, seed implementation and test updates are separate work. No company settings, hero assets, users, orders or other application domains are part of this fixture update.
