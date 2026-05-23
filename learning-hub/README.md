# Learning Hub — OTT Online Learning Platform

A Masterclass-style streaming platform for premium online courses, built as a monorepo. Web app is the primary deliverable in this initial cut; native TV apps (Apple TV, Android TV, Fire TV) are scaffolded for follow-up work.

## Stack

- **Web:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind 4
- **Auth:** Clerk
- **Database:** Neon Postgres + Drizzle ORM
- **Payments:** Stripe Checkout + Billing Portal
- **Video:** Cloudflare Stream (signed playback URLs)
- **TV apps:** React Native + `react-native-tvos` (scaffold only)
- **Monorepo:** pnpm workspaces + Turborepo

## Layout

```
learning-hub/
├── apps/
│   ├── web/           Next.js platform
│   └── tv/            React Native TV (scaffold)
├── packages/
│   ├── db/            Drizzle schema + client + seed
│   ├── types/         Shared TypeScript types
│   ├── ui-tokens/     Design tokens (web + RN)
│   └── config/        Shared tsconfig/eslint/prettier
└── infra/             Ops notes for Stripe + Cloudflare Stream
```

## Quick start

```bash
cd learning-hub
pnpm install

# Configure env (copy and fill in)
cp apps/web/.env.example apps/web/.env.local

# Push schema to your Neon Postgres
pnpm db:push

# Seed with placeholder courses
pnpm db:seed

# Start the web app
pnpm web dev
```

Visit http://localhost:3000.

## Local Postgres (no Neon)

You can point `DATABASE_URL` at a local Postgres (e.g., `postgres://postgres:postgres@localhost:5432/learninghub`). Drizzle uses the standard `postgres` driver — no Neon-specific code paths.

## Stripe test mode

1. Create a product with two recurring prices (monthly + annual) in Stripe test mode.
2. Put the price IDs into `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_ANNUAL`.
3. Use test card `4242 4242 4242 4242` with any future expiry and any CVC.
4. For local webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## Cloudflare Stream

Sample lessons ship with public Cloudflare demo video UIDs so playback works out of the box. To upload your own, see `infra/cloudflare-stream.md`.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run all apps in dev (`turbo run dev --parallel`) |
| `pnpm web dev` | Just the web app |
| `pnpm db:push` | Push Drizzle schema to the DB |
| `pnpm db:seed` | Seed placeholder courses/instructors |
| `pnpm typecheck` | Typecheck every workspace |
| `pnpm lint` | Lint every workspace |
| `pnpm build` | Build every workspace |
