# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other AI agents when working in this repository.

## Project Overview

lakitu is a Turborepo monorepo using Bun as the runtime and package manager. The stack is Vite + React 19 + TanStack Router on the web, and Bun + Elysia on the API, bridged by a `tsup`-built typed SDK consumed via Eden Treaty. Persistence is SQLite via Drizzle ORM (no Postgres / docker for the database — the db is a file). Auth is custom OTP email + JWT, with Mailpit for local SMTP capture.

## Commands

```bash
# Development
bun dev                          # Full stack (API + web + SDK watcher)
bun --filter web dev             # Web app only
bun --filter @lakitu/api dev     # API only

# Quality checks
bun check                        # format-check + oxlint + typecheck (run before committing)
bun lint                         # oxlint + typecheck
bun typecheck                    # TypeScript only
bun format                       # Prettier write
bun fmt                          # format + lint --fix + typecheck

# Testing
bun api:test:e2e                 # API integration tests (Elysia .handle + fetch wrapper)
bun ui:test:e2e                  # UI E2E tests (Playwright)

# Docker (Mailpit only; SQLite is a local file)
bun docker:up                    # Start services
bun docker:up:no-seed            # Same as up — no DB to seed
bun docker:down                  # Stop services
bun docker:rm                    # Stop + remove volumes
bun docker:rm-all                # Nuclear: wipe all lakitu- containers + volumes
bun docker:logs                  # Tail compose logs

# SDK
bun build:sdk                    # Rebuild API SDK exports (auto-runs on postinstall)

# Emails
bun --filter @lakitu/api dev:emails  # react-email preview server on :8888

# Database
bun --filter @lakitu/api db:generate   # drizzle-kit generate
bun --filter @lakitu/api db:migrate    # run pending migrations
bun --filter @lakitu/api db:studio     # drizzle-kit studio
```

Pre-commit hook runs `bun fmt` (format + lint + typecheck).

## Architecture

```
apps/
  web/              # React 19 SPA (Vite, TanStack Router)
packages/
  api/              # Bun + Elysia HTTP API + Drizzle (bun:sqlite)
  ui/               # Shared component library (@repo/ui) — shadcn + Tailwind v4
  tsconfig/         # Shared TS configs
```

## API (packages/api)

Domain modules in `src/modules/`. The layered pattern is `*.routes.ts` (Elysia plugins) → `*.service.ts` (business logic) → `*.repository.ts` (Drizzle queries).

Key conventions:

- **Errors** — Throw `AppError` via helpers: `badRequest()`, `unauthorized()`, `notFound()`, etc. The error plugin in `@core/errors` translates to JSON envelopes — no manual try/catch for response mapping.
- **Config/Logging** — Use `@core/env` and `@core/logger`. Never `Bun.env` or `console.*` in feature modules.
- **Telemetry** — `record()` for spans, `emitMetric()` for metrics, `withTraceContext()` for distributed tracing.
- **API payloads** — snake_case to match clients.
- **Testing** — `lakituApi.handle(new Request(...))` via the `testClient` in `src/test/test.utils.ts`. Network-free, fast. The first POST per file has a known Bun-test timing quirk; the auth-flow file absorbs it with a callback-form warmup at the top.
- **Database** — Drizzle on `bun:sqlite`. Schema in `src/db/schema.ts`. Repositories call `.run()` / `.all()` / `.get()` explicitly (sync drivers).
- **Migrations** — SQL files in `src/db/migrations/`, applied at API startup (`setupApi`) and via `bun --filter @lakitu/api db:migrate`.
- **JWT** — Self-rolled HMAC-SHA256 via `node:crypto` (jose was incompatible with `bun test`'s event loop). See `src/modules/auth/lib/jwt.ts`.
- **Auth dev bypass** — Tester emails ending in `@lakitu.test` accept OTP code `111111` in non-production. Production whitelist via `E2E_OTP_BYPASS_EMAILS` env. See `src/modules/auth/lib/otp.ts`.

## Web App (apps/web)

Feature modules in `src/modules/`, file-based routing in `src/routes/`.

Key conventions:

- **Data fetching** — Eden Treaty client (`lakituApi.module.endpoint.get()`), never `useEffect` for fetching at scale. Use `apiCall<T>(...)` to extract typed data and propagate errors.
- **Types** — Import API types from `@lakitu/api/client` (and feature subpaths as they're added).
- **Auth** — `apps/web/src/modules/auth/auth.store.ts` (zustand) + `lakituAuthApi` in `src/api.ts` (eden client with `fetchWithAuth`).
- **Testing** — `data-testid` attributes for Playwright selectors.

## Shared UI (packages/ui)

- `shadcn/` — Radix primitives styled with Tailwind v4 tokens
- `components/` — Business components (added as project grows)
- `hooks/` — Custom React hooks
- `lib/utils.ts` — `cn()` for class merging
- `styles/index.css` — Tailwind v4 `@theme` tokens (no `tailwind.config.ts`)

When a shadcn primitive imports from `./lib/utils` (or similar internal module), use a **relative** path — `@/*` paths only resolve inside the UI package and break when web consumes the file via `@repo/ui/shadcn/*`.

## API SDK Exports

The API package emits typed subpath modules (`@lakitu/api/client`, `@lakitu/api/core`, `@lakitu/api/auth`) built by tsup. The web app consumes these for type-safe API integration.

Adding a new API module requires the three-step recipe:

1. `packages/api/src/sdk/<name>.ts` — `export * from '../modules/<name>/types';` (use `export type` for types, `export` for runtime values)
2. `packages/api/tsup.config.ts` — add `<name>: 'src/sdk/<name>.ts'` to `entry`
3. `packages/api/package.json` — add `"./<name>": { "types": "./dist/<name>.d.ts", "import": "./dist/<name>.js" }` to `exports`

The `apps/web/src/__sdk-smoke.ts` file is **permanent** — it forces type resolution at compile time so a broken bridge surfaces in `bun check`, not at runtime. Do not delete it.

**Important type-shape rule**: don't export `Static<typeof Schema>` types through the SDK. The dist .d.ts then imports `@sinclair/typebox` internals which consumers can't always resolve. Export plain TypeScript interfaces that mirror the schema shape (see `src/modules/auth/types.ts` for the canonical pattern), and keep the Elysia `t.Object(...)` schema as a separate runtime export.

## Path Aliases

```
@/*           → apps/web/src/                       (web app)
@repo/ui      → packages/ui                         (UI components, via exports)
@lakitu/api/* → packages/api/dist/* (built)         (API SDK subpaths)
@api/*        → packages/api/src/                   (within api package)
@core/*       → packages/api/src/modules/core/      (API core utilities)
```

## Code Style

- **Linter**: Oxlint (not ESLint) — config in `.oxlintrc.json`
- **Formatter**: Prettier with import sorting and Tailwind class ordering
- **TypeScript**: Use `import type` for type-only imports (enforced by oxlint)
- **No `baseUrl` in tsconfigs**: `oxlint-tsgolint` rejects it — use `paths` only (modern bundler resolution handles this)

## Environment & Conventions

- **Dev vs prod conditionals**: always via `config.isProduction` / `isDevelopment` / `isTest` from `@core/env` in the API, and `webEnv.app.isProduction` in the web. Never read `process.env.NODE_ENV` directly in feature modules.
- **Dev-only routes**: gate at the route-registration level with `if (!config.isProduction)`, not inside the handler — defense in depth.
- **OpenAPI docs**: gated to non-prod at the plugin level in `app.ts`.
- **Emails**: when `EMAIL_ENABLED=false` the mailer short-circuits with a warn log and returns `{ ok: true }` (used in test env). Real sending hits Mailpit in dev, swap SMTP host to a real provider (Resend, SES, Postmark) for prod.
- **Tester convenience**: OTP `111111` works for any `@lakitu.test` address outside production. See `src/modules/auth/lib/otp.ts`.

## Known Quirks

- **Bun test + Elysia first POST**: the first POST request in a test file via async/await hits a runner timing bug — the body completes but the runner waits for an internal signal. The auth-flow file has a callback-form (`done`-style) warmup test at the top that absorbs this. Apply the same pattern when adding new test files that exercise POST routes.
- **`jose` JWT library**: keeps the Bun test event loop busy. Replaced with a hand-rolled HMAC-SHA256 JWT using `node:crypto`. Don't reintroduce `jose` unless this is fixed upstream.
