# Frontend localization and public-demo handoff

## Scope and status

Only the `catering-public/frontend` copy was edited. No commit, push, deployment, production database connection, or original-service API request was performed. The original application was read only to compare source and lint results.

First-party UI strings, page metadata, structured data fallbacks, validation messages, accessibility labels, developer comments, maintenance copy and documentation are now English. Document language is `en`, Open Graph locale is `en_US`, date-fns uses `enUS`, and price grouping uses `en-US`. Currency remains RUB and the existing +7 phone mask is retained: translation is not a change of currency, business jurisdiction or telephone validation rules.

Identifiers, API field names, existing route paths and the vendor lockfile were preserved. Legacy Cyrillic parsing and transliteration rules remain equivalent through Unicode escapes; these are compatibility logic, not untranslated UI. Category-count wording now follows English singular/plural rules.

## Sanitization

- Removed the real `.env.local` before localization.
- Replaced `.env.example` with local-only, non-secret defaults and documented server/public variables.
- Removed the embedded revalidation credential. GET and POST schema revalidation now reject requests when `REVALIDATION_SECRET` is unset; supply a newly generated server-only value if needed. Treat the previous embedded credential as exposed and rotate it wherever it was reused; its value is intentionally omitted here.
- Removed original production API/site/IP defaults, forced production Host headers, analytics code and site-verification identifiers.
- Removed a hard-coded business phone fallback and review-profile link. Runtime contact details must come only from the isolated demo backend.
- Removed generated production-derived `schema_markup_debug.json`, `.package_hash` and TypeScript build state.
- Replaced the original production SSH deployment job with a manually triggered validation-only job. It does not deploy or carry production paths.
- Extended `.gitignore` to ignore all local environment files except `.env.example`, generated schema output, scratch files and build state.
- Public production builds return 404 for `/api/debug-jsonld` and `/api/proxy-image`. The original image proxy could fetch arbitrary URLs; it is intentionally not exposed publicly.

The audit covers readable first-party source, configuration and documentation. This is not a penetration test or a dependency-vulnerability certification. Generated/dependency directories and vendor lockfile content are not translated. Images and other binary assets were not OCR-translated or cleared for publication rights; review brand imagery before publishing.

## Read-only demo safeguards

`NEXT_PUBLIC_DEMO_MODE` defaults to enabled unless explicitly set to `false`.

- A visible banner labels the site as a demo, not a live catering service.
- The frontend API query layer rejects non-read requests before Axios runs.
- `proxy.ts` also rejects direct mutating `/api/v1/*` HTTP requests with status 403 before the rewrite forwards them to Django. A direct HTTP POST was tested against a real production-mode Next.js server.
- No successful order response, mock catalog or fabricated backend response was added.

These controls do not replace backend isolation. Never configure this frontend to use the original API, database, media storage, bot credentials or notification channels. Do not turn demo mode off until the isolated backend disables or safely redirects email, Telegram and all other external side effects. A preview cannot safely expose private backend read endpoints merely because writes are blocked.

## API and rendering dependencies

The installed lockfile resolves Next.js **16.1.6**, React **19.2.3**, and TypeScript-based App Router code. Browser API requests use same-origin `/api/v1/`. Next.js rewrites API and `/media/` requests to the configured backend origin. Server components also fetch Django directly using `INTERNAL_API_URL`.

Required API families include:

- `/api/v1/company/`: company name, contact details, location, media, delivery and minimum-order settings.
- `/api/v1/catalog/sections/`, `/categories/`, `/products/`: catalog navigation, product pages, cards and structured data (all under the catalog prefix).
- `/api/v1/blog/articles/` and article slugs: blog pages and embedded products.
- `/api/v1/faq/`, company navigation/legal-document endpoints, and `/api/v1/seo-settings/`.
- `/api/v1/menu-requests/calculate-settings/` and related configuration: menu planner content.
- Order and menu-request submission endpoints: disabled in the default public demo.
- `/api/v1/system-settings/`: schema debug preference.

Server rendering, route handlers, rewrites, the demo proxy and dynamic catalog pages require a Next.js-capable runtime. This application is not a static-export deployment. A build can succeed without Django, but that is not evidence of a working catalog or working checkout.

The existing server catalog/schema caches are process-local. Multi-instance deployments do not share those Maps, and webhook invalidation is not a distributed invalidation mechanism. Plan cache TTLs/shared invalidation or a clean redeployment when demo data changes.

## Safe deployment configuration

Recommended integration: Vercel for this Next.js frontend plus a separately provisioned Django service, fresh database and separate demo media storage. Use English fictional seed content and no production backups. Keep preview access restricted and prevent demo indexing until content and legal pages are reviewed.

Set environment values explicitly for the new deployment before building:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | New isolated backend origin only; no `/api/v1` suffix. |
| `INTERNAL_API_URL` | Server-reachable origin of that same isolated backend. On Vercel this cannot be an origin reachable only from a private laptop. |
| `NEXT_PUBLIC_SITE_URL` | New frontend's public HTTPS origin for canonical links, structured data and media normalization. |
| `NEXT_PUBLIC_MEDIA_URL` | New isolated media origin used by the Next.js image allowlist; expected media path is `/media/**`. |
| `NEXT_PUBLIC_DEMO_MODE` | Keep `true` for public previews. |
| `REVALIDATION_SECRET` | Newly generated server-only secret, or leave unset to disable revalidation. Never prefix it with `NEXT_PUBLIC_`. |

`NEXT_PUBLIC_*` values are included at build time, and rewrites are built from configuration: rebuild/redeploy after changing origins or demo mode. Ensure the backend permits the new frontend/API hosts and is HTTPS-accessible from the deployment. Do not reuse the former forced Host header. Recheck images and screenshots against isolated media; cross-origin screenshot proxying is deliberately unavailable in public production mode.

Authoritative deployment references consulted:

- Next.js deployment: `https://nextjs.org/docs/app/getting-started/deploying`
- Next.js environment variables: `https://nextjs.org/docs/pages/guides/environment-variables`
- Vercel environment configuration: `https://vercel.com/docs/environment-variables`

## Required integration decisions and localization limits

1. Provision and approve the isolated backend/database/media origins before claiming a functional demo. No backend was provisioned or tested by this frontend task.
2. Seed English products, options, sections, categories, company information, FAQs, articles, legal documents, navigation, SEO settings and menu-planner configuration. Database/API-supplied Russian text is passed through unchanged and can override English fallbacks. It was neither fetched from production nor automatically translated.
3. Align backend validation and enum contracts with the English values sent by the frontend, especially contact methods (`Call me`, messenger options), budget labels and food preferences. API keys and route names were not changed. Existing browser localStorage can also retain older Russian labels or user-entered data; use a clean demo browser origin/session.
4. Review legal text and any claims about service, pricing, sanitary standards, delivery times and deposit amounts before public use. Existing standards links are reference links, not a certification of this demo.
5. Keep notifications disabled/sandboxed and verify order persistence only in the isolated system before optionally enabling demo writes. Frontend blocking alone cannot prove backend side-effect safety.
6. Review baked-in image text, brand permissions, responsive layout and actual interactive workflows with real English demo data. No screenshot-based browser QA or live backend checkout test was performed.
7. Address existing lint debt separately. No lint rules were disabled to hide it.

## Actual validation results

- `npm ci --ignore-scripts --no-audit --no-fund`: succeeded; installed 447 packages. No dependency-version or lockfile change was made.
- `node --test tests/localization.test.mjs`: **9 passed, 0 failed**. Content/security regressions were run failing before their corresponding changes. Tests exercise English SEO generation, unchanged transliteration behavior, actual API-query blocking, server-proxy policy, source language, metadata and endpoint/contact sanitization.
- `npm run build`: **passed**, including TypeScript and production route generation. Output identifies dynamic server-rendered routes and the Next.js proxy. It logs a non-fatal dynamic-server-use diagnostic while considering the not-found page for static rendering; the build still exits 0.
- Real local `next start` smoke test with the backend deliberately pointed at an unavailable local port: home returns 200, declares English and displays the demo banner; direct order POST returns 403 with `DEMO_READ_ONLY`; public debug and image proxy endpoints return 404; unset-secret schema revalidation returns 401. The test server was stopped afterward. This proves fallback rendering and safety guards, not backend functionality.
- ESLint currently reports **108 errors and 29 warnings**. The same ESLint configuration applied to the original source text reports **112 errors and 30 warnings**. Remaining issues include existing `any` types, React hook/state/ref rules, conditional hooks and CommonJS imports. A diagnostic message comparison flagged the existing scroll-direction hook because translated nearby comments changed the quoted diagnostic snippet; the offending statement and rule were already present. The new tests and proxy add no lint failures.
- Final first-party text scan found no literal Cyrillic in audited readable files; retained non-English compatibility patterns are escaped and tested. No real environment files remain. Original production endpoint strings are covered by regression checks.

No commit, push or deployment was performed.
