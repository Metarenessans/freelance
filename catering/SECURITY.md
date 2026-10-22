# Security preparation

## Interactive portfolio release

The owner has explicitly enabled a functional sandbox after the initial read-only release. `DEMO_MODE=true` remains enabled; only `PORTFOLIO_ORDERING_ENABLED=true` and the corresponding frontend opt-in permit order/quote creation. Customer read/detail/update operations remain staff-only. Payments and all outbound messaging/revalidation remain off, including for persisted sandbox records after configuration changes.

The curated catalog contains five sections with twelve distinct original products each, translated into English with matching source product and section photos. The current refresh uses allowlisted catalog fields read over SSH inside an explicit PostgreSQL read-only transaction; production data is never updated and source media is only read. No original users, customers, orders or integration settings were imported. See the catalog fixture provenance and `backend/PORTFOLIO_ORDERING.md`.

Sandbox submissions use authoritative catalog/option pricing, atomic inserts, bounded inputs, and shared database-backed rate limits. Returned receipts omit contact details. The site asks visitors to use fictional details; fields are transient in browser storage, but explicitly submitted details are saved privately for the owner's Django administration demonstration. Owner credentials are generated and delivered outside the repository.

The sections below retain the initial sanitization and read-only release history; they are not a claim that current sandbox creation is disabled.

## Scope

This publication copy was created from the local application without carrying over Git history, dependency directories, virtual environments or generated Next.js output. All preparation changes are restricted to this copy. The original project is not the deployment source.

## Pre-publication requirements

- No commit or push until sanitization and an independent review have completed.
- Remove real environment files, local databases, SQL dumps, authenticated sessions, private operational notes, logs and scratch exports.
- Check application code and sample configuration for embedded credentials and private infrastructure details; ignoring `.env` alone is insufficient.
- Run Gitleaks with full redaction before the first commit and scan staged files as a separate gate.
- Do not connect the portfolio deployment to the original production database, payment integrations or messaging recipients.
- Keep configuration values in hosting-provider environment variables, never in source code.

## Initial findings

The initial redacted Gitleaks scan identified three credential findings in local environment files, including Telegram credentials. The copy also contained a local database, an SQL export and an authenticated session file. Operational server notes and assistant-specific local instructions were removed from the copy instead of published.

No secret values are reproduced in this report. A clean scan does not prove the absence of all possible secrets; manual configuration and data review is required as well.

## Credentials

Removing a credential from this copy does not revoke it. If any real credentials were previously shared or committed elsewhere, rotate them at the issuing service. The original local project has deliberately not been modified.

## Verification status

- Redacted Gitleaks scan of publishable source: no findings (generated dependencies, collected static output and build caches excluded).
- Backend regression suite: 30 passing tests; frontend suite: 18 passing tests; publication gates: 3 passing tests.
- Frontend production build succeeds on Next.js 16.4.2; production dependency audit reports no known vulnerabilities. Five development-only dependency advisories remain in the ESLint tooling chain.
- Original source integrity: all 1,075 baseline file hashes remain unchanged.
- Fresh Neon PostgreSQL database: migration chain verified, 3 demo products and 3 sections, no users or orders.
- Demo forms do not collect or persist contact details; order submissions and outbound integrations remain disabled.
- Original portraits/business covers were replaced with food-only imagery, and 10 image backups removed.

Independent actual-file re-review approved the first commit to a private GitHub repository and publication as a public read-only portfolio demo. No active publication-blocking secret, personal-data artifact or logic flaw was found in that scope. The staged snapshot and committed history are scanned separately as release gates. This is not approval for real transactions: before real ordering can be enabled, resolve authoritative server-side pricing, rate limits, durable notifications, upload storage and the other go-live concerns in the component audit report.
