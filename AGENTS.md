# Rubi

## Stack

- **Language / Runtime**: TypeScript (strict), Node 24.x (`.nvmrc`, `engines`)
- **Framework**: Next.js 16 App Router (Cache Components on, `typedRoutes` on), React 19
- **Key dependencies**: Neon Postgres (Frankfurt) via Drizzle ORM + `pg`, Better Auth, Zod v4 + `@t3-oss/env-nextjs`, Tailwind CSS v4 + shadcn/ui, Cloudflare R2 for photos
- **Hosting**: Vercel `fra1`; migrations run in `vercel-build`
- **Package manager**: npm (commit `package-lock.json`, `npm ci` in CI)
- Full stack and reasoning: [spec 0001](docs/specs/0001-stack-architecture/index.md)

## Build approach

Tracer Bullet (prove one real thread through every layer first, then thicken one segment at a time, each slice shipped end to end).

## Commands

```bash
npm ci                 # Install
npm run dev            # Dev server (needs .env.local for your Neon branch dev-<you>)
npm run build          # Build (no migrations); Vercel runs npm run vercel-build
npm run typecheck      # Route types + tsc
npm run db:generate    # SQL migration from src/lib/db/schema/
npm run db:migrate     # Apply migrations to the branch in .env.local
npm run db:seed        # Two published stores, products and orders (refuses the main branch; needs NEON_MAIN_ENDPOINT_ID)
npm run db:check-model # Spec 0002 RLS, grant and checkout checks on your dev branch
npm run lint           # ESLint
npm run format         # Prettier write (format:check in CI)
# Test: not installed yet (/test)
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title/index.md`. Scope lives in `docs/scope/scope.md`.

## Rules

- **Layout**: `src/app` holds routes only and imports from `src/features/<domain>`; features never import from routes. Shared infrastructure lives in `src/lib` (`db`, `auth`, `env`, `logger`, `result`, `money`); the Drizzle schema lives only in `src/lib/db/schema/`.
- **Functional style**: plain functions over classes, pure by default, no shared mutable state (module level values are constants). Side effects (DB, network, cache invalidation) stay at the edges: server actions, route handlers, `withStore` / `withPublic`.
- **Immutable data**: `const` and `readonly`, never mutate inputs; prefer `map` / `filter` / `reduce` where it reads better.
- **Errors**: services return a typed result (`{ ok: true, data } | { ok: false, error }`) for expected failures (validation, not found, conflict); only unexpected faults throw. Server actions map results to field errors; validate every input with a shared Zod schema on the server too.
- **Tenant isolation**: every store scoped query runs inside `withStore(storeId, fn)`; `storeId` only ever comes from `getSellerContext()`, never client input. Storefront reads use `withPublic(fn)` and never touch session, cookies or headers. Never a session level `SET` (pooler is transaction mode); never the owner role at runtime.
- **Data model** ([spec 0002](docs/specs/0002-data-model/index.md)): every table carries `store_id` with `TO rubi_app` policies (`pgPolicy` in the schema); money is `bigint` kobo in `*_kobo` columns, shown with `formatNaira`. `rubi_public` has column grants only, so storefront queries name their columns and every new public column needs a grant migration. The app never deletes orders, customers, order events, products or variants (archive with `archived_at`). Guest orders go only through the `place_order` SQL function via `withCheckout`; store setup uses `withUser` / `withNewStore` with `getSignedInUser()`. Functions, grants and deferred keys live in custom migrations (`drizzle-kit generate --custom`).
- **Storefront cache**: storefront data functions use `"use cache"`, `cacheLife('days')` and tags `store:<id>`, `store-slug:<slug>`, `product:<id>`. Every seller mutation calls `updateTag` for each affected tag (both slugs on a rename). The dashboard is never cached.
- **Migrations**: drizzle-kit SQL files are committed and reviewed; expand then contract. Rerun `npm run auth:generate` after adding a Better Auth plugin.
- **Accessibility**: WCAG AA on all UI: a label on every input, visible focus, 4.5:1 contrast, 44px tap targets.
- **Testing**: unit + integration. Vitest for services, schemas and the data layer (RLS as `rubi_app`, cache tag invalidation for every public mutation); Playwright for key flows at mobile viewport.
- **Commits**: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).

## Tooling

Chosen, installed by `/develop tooling`: ESLint (`eslint-config-next`, flat config) + Prettier with `prettier-plugin-tailwindcss`; Husky + lint-staged running ESLint and Prettier on staged files, then `npm run typecheck`, on every commit; GitHub Actions on each PR per spec 0001 (typecheck with `SKIP_ENV_VALIDATION=1`, lint, Vitest, `drizzle-kit check`), Dependabot weekly.

## Git

- integration: on
- branch prefix: feat/
- commit: per-milestone

## Agent skills

- [vercel-react-best-practices](.claude/skills/vercel-react-best-practices/): `vercel-labs/agent-skills`, React and Next.js performance patterns
- [shadcn](.claude/skills/shadcn/): `shadcn-ui/ui`, adding and composing shadcn/ui components
- [neon-postgres](.claude/skills/neon-postgres/): `neondatabase/agent-skills`, connections, pooling, migrations on Neon
- [neon-postgres-branches](.claude/skills/neon-postgres-branches/): `neondatabase/agent-skills`, dev, preview and CI branches
- [better-auth-best-practices](.claude/skills/better-auth-best-practices/): `better-auth/skills`, Better Auth server, client and plugins
- [better-auth-security-best-practices](.claude/skills/better-auth-security-best-practices/): `better-auth/skills`, rate limits, sessions, trusted origins
- [cloudflare](.claude/skills/cloudflare/): `cloudflare/skills`, R2 buckets and DNS
- [vitest](.claude/skills/vitest/): `antfu/skills`, unit and integration tests
- [playwright-cli](.claude/skills/playwright-cli/): `microsoft/playwright-cli`, browser flows and verification

MCP servers: Neon (connected), Vercel (connected)

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
