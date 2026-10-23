# 0001. Rationale: Next.js on Vercel with Neon Postgres

Decision record for [index.md](index.md). `/develop` does not need this file.

## Context

Rubi gives small Nigerian sellers a storefront plus order tracking, used alongside WhatsApp, Instagram and TikTok. Two very different surfaces share one data set:

- **Public storefronts** are opened from shared links on mid range Android phones over slow, costly mobile data. Link preview crawlers (WhatsApp, Instagram) read them too, so the HTML must arrive complete from the server and arrive fast.
- **The seller dashboard** is used mostly from a phone, needs to feel like an app, and must never show one seller another seller's data.

The forces that shaped the decision:

- **Team**: one developer whose strongest language is TypeScript.
- **Budget**: near zero until weekly active sellers prove the model, so free tiers come first.
- **Geography**: users are in Nigeria, and few cloud regions are close. Cache hits at the edge matter more than where the origin server sits.
- **Data**: relational (stores, products, orders, customers, payments), involves money in naira, and later feeds insights. Tenant isolation is load bearing from the first migration.
- **Delivery**: Tracer Bullet, one real thread through every layer first. So the scaffold must deploy end to end before any slice begins.

If nothing is decided, every slice would invent its own structure, and isolation would be patched in after the fact, which is the costliest kind of rework.

## Options considered

### Option 1: Next.js on Vercel, Neon, Drizzle, Better Auth, R2 (chosen)

One Next.js 16 app on Vercel, Neon Postgres in the same region, auth in your own database, photos on R2.

**Pros**: the smoothest Next.js hosting and previews; a mature ecosystem; Postgres with RLS; no per user auth fees; free image egress through Cloudflare's Lagos edge.
**Cons**: Vercel Hobby is non commercial, so expect Pro at launch; functions run in Europe; two edge vendors.

### Option 2: Next.js on Cloudflare Workers via OpenNext, Neon, Drizzle, Better Auth, R2

The same app and data layers, hosted on Cloudflare's network, which has a Lagos location (basis: Cloudflare network page).

**Pros**: the free tier allows commercial use; compute, images and DNS on one vendor; runs close to buyers.
**Cons**: Next.js on Workers goes through an adapter with some rough edges (some Node APIs, the build pipeline, cache behaviour); fewer production examples; harder debugging for one person.

### Option 3: Next.js on Vercel with Supabase (DB, auth, storage bundled)

Supabase provides Postgres, auth, storage and RLS as one platform.

**Pros**: one vendor for the backend; RLS first workflow; built in phone auth.
**Cons**: the free tier gives a 500 MB database and 1 GB of files, and pauses after a week of inactivity (basis: Supabase pricing page); 1 GB of storage is too small for catalog photos; the Supabase SDK and auth model become central to the codebase.

### Option 4: SvelteKit on Cloudflare, Neon

A lighter framework that ships smaller JavaScript bundles, on Cloudflare.

**Pros**: the smallest pages for slow phones; a commercial free tier; the edge near buyers.
**Cons**: a new framework to learn; a smaller ecosystem for UI kits, forms and auth integrations; slower for one person shipping now.

## Rationale

**Pattern.** At a solo team and pre launch scale, a modular monolith is the only sensible pattern (basis: monolith first). Feature folders keep the domain boundaries clean enough that a later split, or an API for a native app, stays possible without a rewrite.

**Framework.** Next.js wins on the two storefront forces: server rendered, cacheable HTML for crawlers and slow phones, and the largest TypeScript ecosystem for one person. Cache Components with tag invalidation gives CDN speed and still reflects edits within seconds, which a timer based ISR approach cannot (basis: cache invalidation by tag).

**Hosting: your preference against the budget force.** You chose Vercel over Cloudflare Workers. That works and is the lower risk developer experience. But Vercel Hobby forbids commercial use (from my knowledge, not verified in this session), so Rubi needs Pro (about $20 a month) once sellers trade on it, which conflicts with the near zero budget. Option 2 would keep hosting free and closer to Lagos, but only by accepting adapter friction. The spec keeps Vercel and records the cost as a known tradeoff, plus a pre launch budget check in Follow-up. Because storefront HTML is cached and images come from R2 through Cloudflare, most buyer bytes never touch Frankfurt in either option, so the latency gap between the two is smaller than it first appears.

**Data.** Relational data with money and multiple tenants calls for Postgres (basis: relational by default). Neon fits the free tier (1 GB per project, scale to zero) and adds a database branch per preview (basis: Neon pricing page). Pinning Vercel `fra1` and Neon Frankfurt together keeps each query inside one region. Drizzle stays thin and SQL shaped, so reporting queries later stay plain SQL (basis: ORM for CRUD, SQL for complexity).

**Isolation.** Org isolation designed on day one is non negotiable for a multi seller platform (basis: org isolation as afterthought, a known failure pattern). The repository layer gives good ergonomics. RLS, keyed by a transaction scoped setting, catches the one query that forgets its filter, and it works with pooled serverless connections.

**Auth.** Better Auth keeps users in your own Postgres, has a phone number OTP plugin (6 digit codes, a 300 second expiry, 3 attempts; basis: Better Auth phone number plugin docs), and charges no per user fee. That beats Clerk on cost and Neon Auth on control of the OTP and SMS flow, which matters in Nigeria (basis: proven auth library, never roll your own).

**Images.** R2's free egress and Cloudflare's Lagos edge make it the cheapest fast path for the heaviest bytes Rubi serves (basis: R2 pricing page). Keeping photos off Vercel functions and image optimization also protects Vercel quotas.

**Smaller calls made here** (each with its runner up):

- `pg` on Neon's pooled endpoint over the Neon serverless driver, because it is standard Postgres and handles transactions cleanly; runner up: `@neondatabase/serverless`.
- `@t3-oss/env-nextjs` for env validation over hand written Zod parsing, because it is a well known pattern that splits client and server variables.
- Migrations run in the Vercel build (behind an advisory lock) rather than in a separate CI release step, because it is simplest for one person and each preview migrates its own branch. The cost is expand then contract discipline.
- Public reads switch to a read only `rubi_public` role (`SET LOCAL ROLE`) rather than going through a security definer function, because RLS stays the single enforcement point.
- The PWA ships as a manifest only at first. You originally picked Serwist; the cross check showed its Next plugin needs webpack, so the service worker moves to the web push slice and the scaffold stays on Turbopack.
- Preview branches come from a seeded `dev` branch, not `main`, so production personal data never reaches a preview (basis: data minimisation).
- No job queue until a feature needs retries (basis: database backed queue first, only when needed).
- Images served unoptimized from R2 over Vercel image optimization, to save quota and use the Lagos edge.

## References

**Project sources**:
- `docs/scope/scope.md`: the MVP boundary, the Tracer Bullet approach, and the feature 1 "done when"
- `docs/.agent-cache/research/stack-architecture.md`: the landscape check from 2026-10-23

**Practices & standards**:
- Monolith first; a relational database by default; ORM for CRUD, SQL for complexity
- Org isolation from day one (known failure pattern); a proven auth library, never rolled yourself
- Cache invalidation by tag; expand then contract schema migrations
- A database backed queue before a dedicated broker

**Links** (web verified in the 2026-10-23 landscape check):
- Next.js blog (16.4 current): https://nextjs.org/blog
- Neon pricing (free tier limits): https://neon.com/pricing
- Supabase pricing (free tier limits): https://supabase.com/pricing
- Cloudflare network (Lagos location): https://www.cloudflare.com/network/
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Better Auth phone number plugin: https://www.better-auth.com/docs/plugins/phone-number

## Evidence: landscape check (2026-10-23)

- Next.js 16.4 is the latest minor (16.0 went stable in October 2025). Patch releases are frequent, including an October 2026 security update.
- Neon free tier: 100 compute hours and 1 GB per project, 20 GB in total, scales to zero after 5 minutes. Some third party snippets still say 0.5 GB; the official page says 1 GB.
- Supabase free tier: a 500 MB database, 1 GB of files, 2 projects, pauses after a week of inactivity.
- Cloudflare lists Lagos among its African locations. R2 gives 10 GB a month free, with free egress.
- Drizzle: 0.45.x stable and 1.0 in pre release (sources conflict; check npm). Prisma 7 is stable, and v8 is in release candidate.
- SMS OTP pricing for Nigeria could not be confirmed from official pages (the Africa's Talking page refused access). The Seller sign up spec will need current rate cards.
- Not checked: Vercel's African edge presence, Workers free limits, React Router, SvelteKit, TanStack Start.
