# Catering API - sanitized demonstration copy

Python 3.12, Django 5.2, Django REST Framework, SimpleJWT, PostgreSQL and Pillow.
The API exposes catalog, orders, menu requests, company information, FAQs, blog,
and public SEO settings. Django admin manages content and private integrations.

## Safe defaults

- No database exports, real environment files or authenticated Telegram session are included.
- A newly generated `SECRET_KEY` is required. Copy `.env.example` locally and fill it privately.
- PostgreSQL is the default database. Provision a **new isolated persistent database**;
  never use the original production database, credentials, backup, or session.
- `TELEGRAM_ENABLED`, `TELEGRAM_PHONE_LOOKUP_ENABLED`, `EMAIL_ENABLED` and
  `REVALIDATION_ENABLED` are false unless explicitly enabled. Keep them false for the public demo.
- The ordinary Django email backend discards messages. The custom notification sender
  and admin SMTP checks also require `EMAIL_ENABLED=true` before using SMTP.
- `DEMO_MODE=true` (the default) rejects order/menu-request creation with HTTP 503, so the demo does not collect customer details.
- Legacy GitLab deployment jobs are disabled.

## Local setup

```sh
python -m venv .venv
# Activate the virtual environment using your platform's command.
python -m pip install -r requirements.txt
# Copy .env.example to .env, generate a fresh SECRET_KEY, and configure the new DB.
python manage.py migrate
python manage.py load_mock_data
python manage.py runserver
```

`load_mock_data` creates three explicitly labeled English demonstration products,
local media references, categories and demo FAQ/options. It creates no users,
orders, menu requests or notification subscribers. `products.json` is an English
sample payload, not a production export and not a Django fixture for `loaddata`.

## Offline verification

Run with a newly generated temporary secret, `DB_ENGINE=sqlite`,
`SQLITE_PATH=:memory:` and `ALLOWED_HOSTS=localhost,127.0.0.1,testserver`:

```sh
python manage.py check
python manage.py test test_demo test_security --noinput
python manage.py makemigrations --dry-run --check
```

SQLite is an explicit **local test option only**, not production storage for a
serverless deployment. Test migrations run against a fresh in-memory database.

## Production requirements

Set `SECRET_KEY`, `DEBUG=False`, exact `ALLOWED_HOSTS`,
`CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`, `DB_NAME`, `DB_USER`,
`DB_PASSWORD`, `DB_HOST`, `DB_PORT` and provider-appropriate `DB_SSLMODE`.
Use `DB_SSLMODE=require` or stronger TLS verification where supported by the DB provider.
Set `FRONTEND_URL` and `ADMIN_BASE_URL` to the new application URLs.
Keep all outbound integration flags false for the demonstration deployment.

Run migrations against the new database as a controlled release step. Do not
write secrets or create admins during builds. Create an admin privately after deployment.
Serve collected static assets and retained catalog images through an appropriate
static host, CDN or storage service. New uploads require durable object storage or
a persistent volume; the repository's local filesystem is not durable upload storage
on serverless hosts. No production ASGI/WSGI hosting configuration is supplied here.

For Vercel, configure its supported Django request/response runtime and an external
persistent PostgreSQL database. Existing daemon-thread notifications are not a
reliable serverless queue. Keep integrations disabled, or replace them with durable
jobs/webhooks before enabling notifications. The optional long-polling bot needs
its own appropriately configured worker runtime; it is not part of the Django HTTP handler.

See `SECURITY_AUDIT.md` for verified checks, deployment blockers and limitations.
See `LOCALIZATION_REMAINING.md` for backend text still requiring English translation.
