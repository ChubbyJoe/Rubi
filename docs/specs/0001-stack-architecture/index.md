# 0001. Next.js on Vercel with Neon Postgres as the Rubi foundation

**Date**: 2026-10-23
**Status**: Accepted

## Summary

Rubi is one TypeScript app built with Next.js. It serves the public storefronts and the seller dashboard, which installs on a phone like an app (a PWA, a website you can add to the home screen). The app runs on Vercel in Frankfurt, next to a Neon Postgres database, and stores product photos on Cloudflare R2. Storefront pages are cached and served from the edge (servers close to the buyer), so they load fast on slow Nigerian mobile data. A storefront edit refreshes only that one store's pages. Every later feature builds inside this structure, so the scaffold (the empty starting project) should boot, build, and deploy before any slice begins.

## Decision

**Chosen option**: Option 1: Next.js on Vercel, Neon, Drizzle, Better Auth, R2

One full stack Next.js 16 app (a modular monolith, one deployable app split into clear internal modules) on Vercel `fra1`, with Neon Postgres in `aws-eu-central-1`, Drizzle for data access, Better Auth for seller accounts, Cloudflare R2 for photos, and a store scoped data layer backed by Postgres row level security.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.claude/skills/vercel-react-best-practices/`) · `shadcn` (`shadcn-ui/ui`, `.claude/skills/shadcn/`) · `neon-postgres` (`neondatabase/agent-skills`, `.claude/skills/neon-postgres/`) · `neon-postgres-branches` (`neondatabase/agent-skills`, `.claude/skills/neon-postgres-branches/`) · `better-auth-best-practices` (`better-auth/skills`, `.claude/skills/better-auth-best-practices/`) · `better-auth-security-best-practices` (`better-auth/skills`, `.claude/skills/better-auth-security-best-practices/`) · `cloudflare` (`cloudflare/skills`, `.claude/skills/cloudflare/`) · `vitest` (`antfu/skills`, `.claude/skills/vitest/`) · `playwright-cli` (`microsoft/playwright-cli`, `.claude/skills/playwright-cli/`)

Reasoning and options: see [rationale.md](rationale.md).

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Architecture pattern | Modular monolith: one Next.js app, feature modules, thin routes | One person builds and runs it; one deploy, shared types, no service boundaries to maintain. |
| Language | TypeScript (strict), on the current Node LTS (24.x) | Your strongest language, one language end to end. |
| Package manager | npm | Your pick; zero extra install. Commit `package-lock.json`, use `npm ci` in CI. |
| Framework | Next.js 16 App Router, React 19 | Server rendered HTML for crawlers and slow phones, server actions for the dashboard, largest ecosystem. |
| Server logic | Server actions and server components call plain domain services in `src/features/*` | No public API to version until a native app or third party needs one. |
| Storefront rendering | Cache Components (`cacheComponents: true`), `"use cache"` + `cacheTag`, tag invalidation on seller edits | Storefronts are served from the CDN and refresh within seconds of an edit, without hitting Frankfurt on every view. |
| Primary DB | Neon serverless Postgres, region `aws-eu-central-1` (Frankfurt), free tier | Relational data with tenant isolation, money and reporting; a branch per preview; scales to zero. |
| DB access | Drizzle ORM + drizzle-kit SQL migrations, `pg` driver on the Neon pooled connection string | Thin, SQL shaped, schema in TypeScript; plain SQL for reporting later. |
| Tenant isolation | Store scoped repository functions (require `storeId`) + Postgres RLS (row level security, the database refuses rows from another store) as backstop | Two layers: one forgotten filter cannot leak another seller's data. |
| Auth | Better Auth with the Drizzle adapter; users and sessions in your Neon DB; cookie sessions (default lifetime, short cookie cache); rate limit storage in the database; the scaffold signs in with email and password as a placeholder | No per user fee, phone OTP and email plugins, data stays in your DB. The real methods and the SMS provider: decided in the Seller sign up spec. |
| Validation and forms | Zod schemas shared by client and server; React Hook Form + shadcn form components | One schema per input, instant field errors on phones, validated again on the server. |
| Styling and UI kit | Tailwind CSS v4 + shadcn/ui (Radix based) | No runtime CSS cost, accessible components you own. The Design system spec defines the look. |
| PWA | Web app manifest only (`app/manifest.ts`, `start_url: /app`) in the scaffold; Serwist service worker arrives with New order notifications (web push) | Installable seller app now, without leaving the default Turbopack build. Offline shell and push come later, together. |
| File storage | Cloudflare R2 public bucket on a custom image subdomain; browser compresses before upload; presigned PUT uploads | 10 GB free, free egress, served through Cloudflare's Lagos edge. |
| Hosting | Vercel, `vercel.json` `regions: ["fra1"]`, Fluid compute on, Node 24.x project setting, git deploys from GitHub | The smoothest Next.js hosting, previews per PR. Hobby is non commercial, so plan for Pro at launch (see Consequences). |
| DNS | Cloudflare DNS for the Rubi domain; apex and `www` point to Vercel | R2 custom domains need the zone on Cloudflare; Vercel works fine behind a CNAME. |
| Environments | Neon `main` = production; a `dev` branch with fake seed data is the parent of every preview branch and of your local branch (`dev-<you>`); preview branches never come from `main` and are deleted when the PR closes | Migrations are tried in isolation, real seller and customer data never reaches a preview, and idle branches don't eat the compute hour cap. |
| Env and secrets | `@t3-oss/env-nextjs` with Zod; secrets only in Vercel env vars and `.env.local` (never committed) | The build fails fast on a missing or malformed variable. |
| Testing | Vitest (services, schemas, data layer) + Playwright (mobile viewport flows); CI creates a throwaway Neon branch from `dev` per run and deletes it after; RLS tests connect as `rubi_app` | Fast unit runs, real checks of the storefront order flow, and isolation tested as the real runtime role. `/test` records the final preferences. |
| CI | GitHub Actions on each PR (Node 24, npm cache): typecheck (with `SKIP_ENV_VALIDATION=1`), lint, Vitest, `drizzle-kit check`; Vercel builds the preview; Dependabot weekly | Breakage is caught before a preview or prod deploy. |
| Background jobs | None in the MVP. Use `after()` for fire and forget work, Vercel Cron for schedules; add a database backed queue only when a feature needs retries | No jobs exist yet. New order notifications decides this for real. |
| Observability | Vercel runtime logs plus structured `console` JSON logs in the scaffold | Error monitoring and product events: decided in the Error monitoring spec. |

### Structure and conventions the scaffold sets up

- **Framework settings**: TypeScript strict, `@/*` path alias to `src/*`, `typedRoutes` on, React Compiler off for now (runner up: on, once build times are known), `cacheComponents: true`. Node 24 pinned in `package.json` `engines` and `.nvmrc`. Zod v4.
- **Folders**: `src/app` holds routes only. `src/features/<domain>` (`stores`, `catalog`, `orders`, `customers`) holds services, queries, Zod schemas and components. `src/lib` holds shared infrastructure (`db`, `auth`, `storage`, `env`, `logger`). The Drizzle schema lives in one place, `src/lib/db/schema/` (one file per domain, plus the generated `auth.ts`), so drizzle-kit sees it all. `src/components/ui` holds the shadcn components. A route imports from features; features never import from routes.
- **Route groups**: `(marketing)` at `/`; `(auth)` at `/sign-in`, `/sign-up`; `(dashboard)` at `/app/...` (dynamic, signed in sellers only); `(storefront)` at `/s/[storeSlug]` and `/s/[storeSlug]/p/[productSlug]` (public, cached). `rubi.ng/s/<slug>` is the permanent canonical store link; a future custom domain maps onto the same store, and `/s/` links keep working forever. Root `not-found`, `error` and `global-error` pages exist from the scaffold.
- **Auth guard**: `proxy.ts` (Next 16's replacement for middleware) only makes an optimistic redirect to `/sign-in` when `/app/*` has no session cookie. The real check is `getSellerContext()` in the data layer, which reads the session, loads the seller's store through `stores.owner_user_id`, and returns `{ userId, storeId }`. Every dashboard read and action starts with it. Session reads sit under Suspense, as Cache Components requires.
- **Database connection**: one module level `pg.Pool` (small `max`, short idle timeout) registered with `attachDatabasePool` from `@vercel/functions`. Never use a session level `SET`; only transaction scoped `set_config(..., true)` and `SET LOCAL`, because Neon's pooler is in transaction mode.
- **Roles**: `rubi_app` (runtime, no `BYPASSRLS`) and `rubi_public` (read only, published rows only; `rubi_app` is a member so it can switch into it) are created once on `main`, so every branch inherits them with the same passwords. The owner role is used only for migrations. Better Auth tables (`user`, `session`, `account`, `verification`) get plain grants to `rubi_app` and no RLS, because auth reads them before any store exists.
- **Tenant isolation contract**: every store scoped query runs through `withStore(storeId, fn)`, which opens a transaction and calls `set_config('app.store_id', storeId, true)`. RLS policies compare `store_id` to that setting. `storeId` only ever comes from `getSellerContext()`, never from client input. The Data model spec writes the actual policies.
- **Public reads contract**: storefront reads run through `withPublic(fn)`, which opens a transaction with `SET LOCAL ROLE rubi_public`. They never touch the session, cookies or headers.
- **Storefront caching contract**: storefront data functions use `"use cache"`, take the slug or IDs as arguments, use `cacheLife('days')` (invalidation is explicit), and tag `store:<storeId>`, `store-slug:<slug>` and `product:<productId>`. An unknown or unpublished slug calls `notFound()`. Seller server actions call `updateTag` for every affected tag, so the seller sees their own edit at once; `revalidateTag(tag, 'max')` is only for route handlers and webhooks. Renaming a slug invalidates both the old and the new `store-slug` tags. The dashboard is never cached.
- **Images**: product photos never pass through Vercel functions or Vercel image optimization. The browser compresses to WebP, the server action hands back a presigned R2 URL, and the storefront renders R2 URLs straight from the Cloudflare edge (with `next/image` `unoptimized`, or a custom loader). There are two buckets, `rubi-images-dev` (local and previews) and `rubi-images-prod`, each with its own API token scoped to object read and write on that one bucket, and CORS allowing PUT from the app's origins (production, `localhost`, and this project's preview URLs). Until the domain exists, prod serves images from the bucket's `r2.dev` URL. The Add a product spec settles sizes and variants.
- **Migrations**: drizzle-kit generates SQL files, which are committed and reviewed. Better Auth's CLI generates its Drizzle schema into `src/lib/db/schema/auth.ts`, and drizzle-kit owns every migration. The Vercel build runs `scripts/migrate.ts` before `next build`. It takes a Postgres advisory lock (a database wide "one at a time" lock) on the unpooled URL, so two builds never migrate the same branch at once, then applies pending migrations. Failures are fixed forward, with Neon's instant restore as the escape hatch. Schema changes follow expand then contract (add the new shape, ship code that uses it, remove the old shape in a later deploy), because a migration lands before its deploy goes live.
- **Environment URLs**: in previews, `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` derive from `VERCEL_BRANCH_URL` (falling back to `VERCEL_URL`) inside `src/lib/env`, and Better Auth `trustedOrigins` allow this project's preview URLs. Production runs on the `vercel.app` URL until the domain exists, so the domain does not block the scaffold.
- **Logging**: a tiny JSON logger in `src/lib/logger` (level, message, context, request ID) over `console`. A real tool comes with the Error monitoring spec.
- **Time and money basics**: store timestamps as `timestamptz` in UTC and display them in `Africa/Lagos`. The Data model spec settles the money type (integer kobo is the expected default).
- **Lint, format, pre commit**: left to feature 2 (`/audit`), from the real scaffold.

### Configuration required

All variables are listed in a committed `.env.example`. Required to deploy the scaffold: the database and auth variables. R2 variables stay optional in the env schema until feature 6.

- `PGHOST`, `PGHOST_UNPOOLED`, `PGDATABASE`: injected per branch by the Neon/Vercel integration (by hand in `.env.local` for local work)
- `RUBI_APP_DB_PASSWORD`: password of `rubi_app`; `src/lib/env` builds the runtime URL from it plus the pooled `PGHOST` (the integration only injects owner credentials)
- `DATABASE_URL_UNPOOLED`: owner role, direct connection, used only by `scripts/migrate.ts` (injected by the integration)
- `BETTER_AUTH_SECRET`: auth signing secret, one per environment
- `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`: set in production and locally; derived from `VERCEL_BRANCH_URL` in previews
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `NEXT_PUBLIC_IMAGE_BASE_URL`: photo uploads and public image host (dev bucket for local and previews, prod bucket for production)
- `NEON_API_KEY`, `NEON_PROJECT_ID`: GitHub Actions secrets for the throwaway CI branches

### Scaffold is done when (from the scope)

The empty scaffold boots locally, builds, and deploys to a Vercel preview and to production, connected to its Neon branch, with one cached storefront route and one signed in dashboard route rendering. `/develop` derives the scaffold steps from this table.

## Consequences

**Positive**:
- One codebase, one language, one deploy: the fastest path for one person to get real sellers.
- Storefronts load from the CDN and Cloudflare's Lagos edge, not from Frankfurt, which matters on slow mobile data.
- Seller isolation is enforced twice, in code and in the database, from the first migration.
- Every layer runs on a free tier through the build. Nothing here needs a server you operate yourself.

**Negative / tradeoffs**:
- **Vercel Hobby forbids commercial use.** Once Rubi carries real sellers, expect Vercel Pro at about $20 a month. That breaks your near zero budget. It's the price of choosing Vercel over Cloudflare Workers.
- Uncached requests (dashboard, checkout, sign in) make a round trip to Frankfurt, roughly 100 to 200 ms extra from Lagos. Keep dashboard pages lean and avoid chains of sequential queries.
- Two vendors carry the edge (Vercel for the app, Cloudflare for DNS and images), so there are two dashboards and two bills to watch.
- Serverless limits apply: functions time out, there are no long lived connections, and Neon cold starts after 5 idle minutes add latency to the first request.
- RLS with a transaction scoped setting adds a transaction to every store query and needs discipline: never use the owner role at runtime.
- Neon free tier: 1 GB storage and 100 compute hours per project. That's fine for the MVP, but watch it as orders and catalog data grow.
- Cache Components is a new model. Forgetting to invalidate a tag shows stale storefronts, so every public data mutation needs a test.

**Neutral**:
- No service worker until web push: the seller app is installable but has no offline shell yet. When it arrives, its scope must exclude auth routes and never cache signed in responses (shared phones are common).
- Vercel Hobby runs cron only once a day, so per minute schedules (relevant to New order notifications) need Pro or another trigger.
- Drizzle's version line is moving (0.45 stable, 1.0 in pre release as of this check). Pin whatever npm marks stable at scaffold time.
- A future native app would add a typed HTTP API over the same `src/features` services; nothing here blocks that.

## Follow-up

- [ ] Register the Rubi domain (a `.ng` or `.com.ng` name, for example) and move its DNS to Cloudflare before launch; `rubi.ng` in this spec is only an example. Not a scaffold blocker.
- [ ] Data model spec (feature 3): write the RLS policies for `rubi_app` and `rubi_public`, the `stores.owner_user_id` link, money as integer kobo, and the ID type (text to match Better Auth, or uuid).
- [ ] At scaffold: check whether the Neon/Vercel integration can create preview branches from `dev`; if not, create and delete them from a GitHub Action instead.
- [ ] New order notifications spec (feature 11): add the Serwist service worker with web push; check the Hobby cron limit.
- [ ] Seller sign up spec (feature 5): sign in methods, the SMS OTP provider for Nigerian numbers (Termii, Africa's Talking, Twilio; get current rate cards and check NCC sender ID rules), and the reserved store slug list.
- [ ] Add a product spec (feature 6): image sizes, variant generation, and whether to use Cloudflare image transformations.
- [ ] Error monitoring spec (feature 16): error tracking and product analytics tools.
- [ ] Budget check before launch: Vercel Pro (about $20 a month), or move hosting to Cloudflare Workers via OpenNext if near zero cost still matters more than Vercel's polish.
- [ ] Feature 2 (`/audit`): write root `AGENTS.md` from the real scaffold, including this structure, the `withStore` rule, and the cache tag rule.

## Rationale

Reasoning, options considered, the landscape check, and references: see [rationale.md](rationale.md).
