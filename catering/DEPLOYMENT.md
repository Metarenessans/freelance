# Git-based deployment

## Architecture

One GitHub repository contains both applications:

- Vercel project `catering-portfolio`: project root `frontend`, Next.js runtime.
- Vercel project `catering-portfolio-api`: project root `backend`, Django runtime.
- An isolated Neon PostgreSQL project stores only English demonstration data.

The website and API are separate deployments of the same Git revision. Deployment must use the GitHub repository, not the original local project. Both Vercel projects should be connected to the repository with `main` as the production branch.

## Configuration

Real configuration is held in encrypted Vercel environment variables, not repository files. The component `.env.example` files document local configuration; blank secrets are intentional. The demonstration uses a newly generated Django signing key and new database credentials.

Frontend variables:

- `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`: the isolated Django HTTPS origin.
- `NEXT_PUBLIC_SITE_URL`: the new frontend HTTPS origin.
- `NEXT_PUBLIC_MEDIA_URL`: the isolated Django media origin.
- `NEXT_PUBLIC_DEMO_MODE=true` and `NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED=true` enable transient test checkout while preserving sandbox restrictions.

Backend variables:

- A fresh `SECRET_KEY` and the isolated PostgreSQL `DB_*` configuration with TLS.
- Exact `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `FRONTEND_URL` and `ADMIN_BASE_URL`.
- `DEBUG=false`, `DEMO_MODE=true`, `PORTFOLIO_ORDERING_ENABLED=true`.
- `TELEGRAM_ENABLED=false`, `TELEGRAM_PHONE_LOOKUP_ENABLED=false`, `EMAIL_ENABLED=false`, `REVALIDATION_ENABLED=false`.
- `PUBLISH_DEMO_MEDIA=true` publishes the approved read-only media snapshot through Django collected static assets. Vercel rewrites `/media/` to `/static/demo-media/`. This is not persistent upload storage.
- `TRUST_PROXY_SSL=true` is appropriate only behind a trusted proxy that overwrites the forwarded-protocol header, as configured for Vercel.

The Django build command checks configuration, applies migrations and idempotently seeds only the isolated catalog. It must never be pointed at the original production database. The seeder preserves users, orders, order-item snapshots and settings. Explicitly enabled sandbox order/quote POSTs persist private demo records; contact fields are not retained in localStorage. Outbound integrations remain disabled. Owner administrator creation is a separate secure operation; no account or password is seeded from source.

## Verification gates

The GitHub Actions validation workflow scans committed history for secrets, runs publication/backend/frontend tests, checks migrations, builds Next.js and audits production JavaScript dependencies. Existing lint debt and development-only advisories are documented separately and are not suppressed.

The portfolio now uses server-authoritative pricing and persistent test-order records. Before converting it into a real catering business, separately review payments, durable messaging, rate-limit capacity and proxy trust, personal-data retention, writable media storage, backups and production operations. The current limits and sandbox restrictions are described in `backend/PORTFOLIO_ORDERING.md`.

## Provider limits

The prepared accounts use Vercel Hobby and Neon Free. No paid plan upgrade is part of this setup. Provider quotas and inactivity/cold-start behavior still apply. Monitor provider dashboards before expanding the workload.
