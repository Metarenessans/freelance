# Portfolio ordering contract

## Opt-in (deployment owner only)

```dotenv
DEMO_MODE=true
PORTFOLIO_ORDERING_ENABLED=true
EMAIL_ENABLED=false
TELEGRAM_ENABLED=false
TELEGRAM_PHONE_LOOKUP_ENABLED=false
REVALIDATION_ENABLED=false
```

`PORTFOLIO_ORDERING_ENABLED` defaults to `false`; only the exact value `true`
(case-insensitive) opts in. Keep payment integrations absent/disabled. No payment
or fulfillment is performed. The frontend's corresponding build-time flag is
`NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED=true` (in addition to its demo mode).
Point Django only at the new isolated portfolio database. Do not import customer
records, subscriber records, sessions or users from the original project.

Apply schema changes using `python manage.py migrate --noinput` before enabling
creates: orders migrations `0007`, `0008`, `0009`; menu_requests migration `0011`.
These add sandbox markers, option snapshots and worker-shared rate counters.
No deployment settings, cloud variables or owner credentials are set by this change.

## POST /api/v1/orders/

Content-Type: application/json. Existing flat contact fields remain supported:

```json
{
  "items": [
    {
      "id": "local-cart-key",
      "productId": 123,
      "quantity": 2,
      "selectedOption": {"id": "456"},
      "name": "Client display label",
      "imageUrl": "https://example.invalid/image.jpg",
      "priceInfo": {"price": 1}
    }
  ],
  "name": "Portfolio tester",
  "phone": "DEMO-NOT-A-REAL-PHONE",
  "contact_method": "Call me",
  "comment": "Synthetic portfolio test",
  "guests": "10",
  "event_date": null
}
```

- `productId` must reference an active catalog product in an active category (or
  an uncategorized active product). A numeric database `id` is a legacy fallback;
  random cart IDs are not database identifiers.
- For a product with options, send `selectedOption: {"id": "456"}` or
  `optionId: 456`. The option must be active and belong to that product. Omitting
  an option is rejected if the product has any options. If both aliases are sent,
  they must match. Omit options for products without them.
- Quantity: integer 1–999, at least the option minimum (if set), otherwise the
  product minimum. Duplicate product/option lines are rejected. Up to 50 lines.
- Names, images and prices are snapshots from the database, never from the client.
  Client `totalPrice`, `finalPrice`, item `priceInfo.price`, etc. cannot control
  saved amounts. Display metadata and priceInfo are optional, accepted only for
  compatibility. The optional cart URL is discarded in portfolio mode.
- Existing pricing policy remains: minimum item total 5000, delivery 1500 below
  10000, free delivery at/above 10000, in catalog currency. These are estimates,
  not charges. All inserts are one atomic order+items transaction.
- Contact bounds: name 200, phone 30, contact method 50, guests 100, comment 2000
  characters. Send synthetic details, not real customer information.

Success **201**, only a receipt (no contacts or item/contact echo):

```json
{"id": 42, "status": "new", "is_demo": true,
 "total_price": "8000.00", "delivery_cost": "1500.00", "final_price": "9500.00"}
```

The database record remains available in authenticated Django admin at
`/admin/orders/order/<id>/change/`, including catalog references, option names,
quantities and server prices. The sandbox marker is read-only and filterable.

## POST /api/v1/menu-requests/

```json
{"format": "Buffet", "guests": "10", "budget": "10000", "date": null,
 "additional": [], "name": "Portfolio tester", "phone": "DEMO",
 "contact_method": "Call me", "consent": true}
```

`additional` accepts up to 30 strings of at most 200 characters: active additional
service database IDs or recognized food preferences from the active quote options
(and legacy built-in food labels). Unknown/inactive services are rejected.
Name/phone/contact bounds match orders; format/guests/budget are limited to 100.
Consent is required; event dates, when supplied, cannot be in the past.
Success **201** returns only `id`, `status`, `is_demo`. Records appear at
`/admin/menu_requests/menurequest/<id>/change/`.

## Safety and status codes

- Default demo with opt-in off: **503**, no order/menu record.
- Enabled but invalid inputs/catalog/minimums: **400**, no partial order.
- JSON body over 64 KiB: **413**. Non-JSON bodies: **415**.
- Shared order+quote create limits: **5 per fixed minute / 30 per UTC day** per
  server peer address, including invalid attempts; exceeded: **429** with
  Retry-After. Atomic database counters survive worker/cache resets. No Redis or
  cache table setup is needed. Only short-lived HMAC keys (not raw IPs) are
  retained; expired counters are deleted on subsequent creates.
- Forwarded headers are deliberately not trusted. If the platform reports a
  shared proxy peer, these conservative caps are shared by those visitors. Do not
  trust unvalidated X-Forwarded-For to bypass this; use provider edge limits or a
  separately validated proxy configuration if per-visitor scaling is needed.
- Anonymous list/retrieve/update/delete: **401/403**; authenticated non-staff:
  **403**. Staff-only API/admin permissions are unchanged.
- Sandbox creation schedules **no notification threads**. The demo mode or
  portfolio opt-in also overrides enabled email/Telegram/phone-lookup/revalidation
  transport flags. Persisted `is_demo` records cannot be sent by order/quote
  notification entry points even if mode flags later change.
- No new public read endpoint, contact logging, account registration or payment
  endpoint is introduced.

## Verification

The existing explicit `test_demo` CI module imports the real portfolio integration
suite in `apps/orders/test_portfolio_ordering.py`. Run the existing CI invocation:

```sh
python manage.py test test_security test_demo test_portfolio test_review_security catering_backend.test_deployment --noinput
python manage.py makemigrations --dry-run --check
```

Tests create Django's isolated test database and synthetic products/users. They
must never be run against a live database with a test-name override pointing to
that live database. Deployment verification against the new Neon database remains
the deployment owner's task.
