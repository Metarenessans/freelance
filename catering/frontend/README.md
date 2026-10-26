# Catering frontend

English-language public copy of a Next.js 16 App Router application using React 19, TypeScript, Redux Toolkit, Axios and Sass modules.

## Local setup

Use a supported Node.js release. Run `npm ci`, copy `.env.example` to `.env.local`, and start `npm run dev`. Use only a separately provisioned demo Django backend. The browser calls same-origin `/api/v1/`; Next.js proxies it to the configured backend.

## Validation

- `node --test tests/*.test.mjs`
- `npm run build`
- `npm run lint`

This application relies on the demo Django API for live data and does not fabricate API responses. Orders and quote requests are disabled by default.
