# Security and privacy audit — sanitized copy

Audit date: 2026-10-20. Scope: only `catering-public/backend` and
`catering-public/telegram-bot`. The original repository was not edited.
No Git initialization, commit, push, deployment, real Telegram message, real SMTP
message, original API request or original database connection was performed.
This is a source/privacy audit and offline regression check, not a penetration test.

## Findings and remediation

### Critical: copied secrets and private operational data

Removed from the copy:

- `backend/.env`
- `telegram-bot/.env`
- `backend/anon.session` — an authenticated Telegram session database, not a harmless cache
- `backend/db.sqlite3`
- `backend/dump/catering_db_prod.sql.gz`
- `backend/dump/local_backup_before_prod_sync.sql`
- `backend/scratch_migration.log`
- Existing Python bytecode and Ruff cache artifacts

Secret values are intentionally absent from this report. The prior secret scan
reported credential findings in both real environment files. Copy deletion is
**not revocation**: the owner should rotate exposed tokens, API credentials,
passwords, application signing secrets and authenticated sessions through the
appropriate provider. No credentials were rotated or original services modified.

### High: hardcoded configuration and unsafe deployment recipes

- Removed the committed/default frontend revalidation secret, weak Django signing
  fallback and copied database/proxy/Telegram credentials.
- Django now requires a newly supplied `SECRET_KEY`; `DEBUG` defaults to false.
- Replaced legacy production hosts, mailboxes, registry examples, coordinates and
  account-specific examples in source/config/documentation with local or reserved
  example values. Relative media URLs no longer use a hardcoded production host.
- Replaced Compose credentials with required environment variables and loopback-only
  database port binding. Its volume name is specific to the demonstration database.
- Disabled both legacy GitLab deployment workflows. Removed their original SSH
  targets, production hostnames, password recovery command, token-in-URL clone
  recipe and automatic deployment scripts.
- Explicit backend `.env` loading no longer searches ancestor directories.
- Bot `.env` loading no longer falls back to backend/root environment files.
- Added backend and bot ignore rules for secrets, sessions, databases, dumps and logs.
  Catalog media is retained; private document uploads are ignored.

### High: accidental outbound notifications / customer-data collection

All outbound integrations fail closed unless individually opted in:

- `TELEGRAM_ENABLED=false` guards both bot API requests/polling and backend messages.
- `TELEGRAM_PHONE_LOOKUP_ENABLED=false` guards Telethon phone lookups independently.
- `EMAIL_ENABLED=false` guards custom email notifications and both admin SMTP tests.
- `REVALIDATION_ENABLED=false` guards the frontend webhook before starting a thread.
- Django's default email backend discards messages; custom SMTP code still requires
  the separate email opt-in.
- `DEMO_MODE=true` is the default and rejects new order/menu-request submissions with
  HTTP 503 before serializer validation or persistence. Keep it true for the demo.

Flags must remain disabled in the public demonstration deployment, even if someone
accidentally adds a token or SMTP configuration to the new environment/database.
The default bot command was exercised and exited without a Telegram request.

### Privacy-sensitive diagnostics

Removed SMTP password prefix/suffix/length disclosure from the admin diagnostic.
Removed proxy URLs from bot connection logs and replaced Telegram/proxy exception
strings with exception class names in outbound helpers. Removed recipient lists
from notification logs and SMTP login data from configuration error messages.
This is not a guarantee that all runtime Django/admin error paths are PII-free;
keep production debug off and restrict log access.

### Dependencies

`pip-audit` on the original backend requirements reported 92 known vulnerabilities
across seven direct packages. Updated the affected backend pins to:

- Django 5.2.17
- Django REST Framework 3.17.2
- SimpleJWT 5.5.1
- python-dotenv 1.2.2
- Pillow 12.3.0
- requests 2.33.0
- pypdf 6.19.0

Updated bot requests/python-dotenv pins consistently. Reinstalled and exercised the
backend with these versions under isolated Python 3.12. Subsequent `pip-audit`
checks returned **no known vulnerabilities** for both requirements files. This
is a point-in-time advisory result, not proof of absence of vulnerabilities.
Transitive dependencies are resolved rather than locked in a complete lockfile.

## Media and demonstration data

539 files were retained under catalog/section/hero/company media folders. No
separate customer-upload, legal-document or other personal-upload files were found
in the supplied media inventory. Product and marketing assets were preserved.
This was not a face-recognition, ownership/licensing, image-metadata or visual
privacy audit of every asset; review those separately before making media public.

Replaced `products.json` with three explicitly labeled English demonstration
products and local image references. It is a sample API-shaped payload, not an
export of customer records and not a Django `loaddata` fixture. The English
`load_mock_data` command creates three demo products, categories, FAQ/options and
blank demo company information, and never seeds customers, staff, orders,
menu requests or notification recipients. Removed its remote stock-image targets.

## Actual architecture and production needs

This is a stateful Django/DRF application, not a static frontend or Node backend:

- Django admin/content models and PostgreSQL persistence.
- JWT authentication via SimpleJWT.
- Catalog, blog, company/legal-document conversion, FAQs, orders, menu requests,
  system settings and public SEO endpoints.
- Pillow-based image processing and document conversion libraries.
- Optional custom SMTP/Telegram notifications and Next.js cache-revalidation webhook.
- Separate optional requests-based Telegram long-polling worker using the backend ORM.
- Existing notifications use daemon threads, not a durable task queue.

**Production requires a new persistent PostgreSQL database.** Configure new
`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and provider-appropriate
`DB_SSLMODE`, a fresh `SECRET_KEY`, `DEBUG=False`, exact `ALLOWED_HOSTS`,
`CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`, `ADMIN_BASE_URL` and `FRONTEND_URL`.
Keep `DEMO_MODE=true` and all outbound flags false. Never import the original
DB/dump, point at its API, or reuse original recipients or Telegram sessions.

`DB_ENGINE=sqlite` and `SQLITE_PATH=:memory:` are explicit isolated test options.
An ephemeral SQLite file is not production-ready storage on Vercel/serverless.
Vercel Django request/response hosting needs an external persistent database and
correct static/media hosting. Migrations must run as a controlled release step.
Use durable object storage/persistent media storage for uploads; local function
storage cannot be treated as durable. The bot is not part of the Django HTTP
handler and requires an appropriate separately configured worker runtime if ever
intentionally enabled. A persistent Django service is another deployment option.
No deployment integration was configured or verified in this scoped task.

## Verification performed

- Parsed all first-party Python files without syntax errors.
- Django `check`: no issues.
- Django `makemigrations --dry-run --check`: no pending model changes after adding
  the new safe-default migration.
- Complete migration chain exercised against a new in-memory SQLite test DB.
  The pre-existing catalog migration 0009 used PostgreSQL-specific table discovery;
  replaced that discovery with Django introspection and quoted its `order` column,
  preserving migration identity/dependencies and PostgreSQL compatibility.
- `test_security.py`: six fail-closed outbound regression tests, observed failing
  before guard implementation and passing after it.
- `test_demo.py`: six integration tests for English demo catalog/local images,
  absence of customer/staff/subscriber data, protected record listings, rejection
  of demo customer submissions, public settings credential exclusion, and blocked
  HTTP calls from disabled notification functions.
- Both dependency audits: no known vulnerabilities in resolved requirements.
- Final private-artifact inventory: no `.env`, database, SQL dump, authenticated
  session, migration log or bytecode file left in the two scoped directories.
- First-party text scan for Telegram token/private-key/private-address patterns:
  no findings. Independently rerun a redacted secret scanner before committing.
- Default bot startup: disabled exit, no Telegram requests or messages.

Tests used only a new in-memory SQLite database and fake test configuration.
No live PostgreSQL service or hosting deployment was exercised, so PostgreSQL
connectivity, provider TLS, runtime configuration and static/media deployment
remain release checks rather than verified claims.

## Residual concerns / go-live blockers

1. Owner-side credential/session revocation remains necessary; deletion alone
   cannot revoke access or erase existing provider/history copies.
2. English localization remains incomplete in backend help/validation text,
   notification text, comments, docstrings, HTML templates and historical defaults.
   See `LOCALIZATION_REMAINING.md` for exact paths/lines. Do not claim the whole
   project is fully English yet. Bot code and both READMEs are English.
3. Keep the bot disabled. Its existing contact-authorization flow must verify that
   a shared contact belongs to the sender before binding a phone subscriber.
4. Before accepting real orders, review server-side pricing (the current serializer
   totals submitted item prices), abuse/rate limits, HTML escaping in notifications,
   transaction boundaries and durable notification delivery. Demo creation is blocked.
5. Admin-editable SMTP/Telegram/webhook/proxy fields store sensitive configuration
   in the database. Restrict admin access and protect database/backups; prefer
   environment/secret-manager configuration for actual credentials.
6. Enabling admin notification actions requires a separate review of HTTP method,
   CSRF and user confirmation semantics; flags currently prevent outgoing sends.
7. HTTPS proxy configuration, redirects/HSTS, provider database TLS, dependency
   locking, media ownership/privacy, persistent uploads, backups and a live DB smoke
   test remain production work. No claim of production deployment readiness is made.

No Git operations were performed. Everything described as changed is confined to
this copy's backend and telegram-bot directories, plus disposable audit tooling in
Hermes scratch storage. Original production data and services were not modified.
