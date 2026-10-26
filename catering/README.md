# Catering application

An English-language publication copy of a catering web application, with a Next.js frontend, a Django REST backend, and an optional Telegram integration.

## Components

- `frontend/`: Next.js application.
- `backend/`: Django application and REST API.
- `telegram-bot/`: optional messaging integration, disabled unless explicitly configured.

## Security

Local environment files, private server credentials, database exports, and sensitive credentials must not be published. Use the component `.env.example` files to create local configuration. Provide fresh secrets through your hosting provider's environment configuration. Never connect a public preview to live production databases or third-party messaging credentials.

## Development

See `frontend/README.md`, `backend/README.md` and `telegram-bot/README.md` for component-specific instructions.

## Live portfolio

- [Open the website](https://catering-portfolio-six.vercel.app)
- [Browse the product API](https://catering-portfolio-api.vercel.app/api/v1/catalog/products/)
- [Repository](https://github.com/Metarenessans/catering-portfolio) - private source; the demonstration website is public.

Both applications deploy from this GitHub repository through Vercel, using the `frontend` and `backend` project roots. Pushes to `main` trigger production deployment. The isolated Neon PostgreSQL database contains the curated English product catalog and portfolio-only submissions, never original customers or orders.

This is an interactive portfolio sandbox, not a live catering business. The notice appears only on the homepage. Five sections contain twelve distinct products each, refreshed from the live production catalog through a read-only SSH export and translated into English with matching original product and section photographs. Currency remains RUB and original source prices are preserved.

Cart orders and menu requests are submitted to the real Django API and stored in the isolated PostgreSQL database as demo records. They are visible only to authenticated staff in [Django administration](https://catering-portfolio-api.vercel.app/admin/). Owner credentials are delivered separately and never committed. Use fictional contact details when trying the forms; contact inputs are not retained in browser storage.

The server resolves product/option prices from its own catalog, validates quantities and saves orders atomically. Public submissions have shared database-backed limits. Payments, Telegram, email and outbound revalidation remain disabled. Do not treat the portfolio as a production ordering service.

Both applications deploy independently with isolated databases, environment variables, and automated verification gates.
