# Rubi

A storefront and order book for small Nigerian sellers. Next.js 16 on Vercel (`fra1`), Neon Postgres (`aws-eu-central-1`), Drizzle, Better Auth. The stack and its reasoning live in [spec 0001](docs/specs/0001-stack-architecture/index.md).

## Run it locally

You need Node 24 (`nvm use`).

1. `npm ci`
2. Copy `.env.example` to `.env.local` and fill it for your own Neon branch (`dev-<you>`, made from `dev`). `RUBI_APP_DB_PASSWORD` is the same on every branch.
3. `npm run db:migrate` applies pending migrations to your branch.
4. `npm run dev`, then open http://localhost:3000.

## Scripts

| Script                   | What it does                                                           |
| ------------------------ | ---------------------------------------------------------------------- |
| `npm run typecheck`      | Generates route types, then runs `tsc`                                 |
| `npm run lint`           | ESLint (Next.js core web vitals and TypeScript rules)                  |
| `npm run format`         | Prettier, writes fixes (`format:check` only reports)                   |
| `npm run build`          | Production build (no migrations)                                       |
| `npm run vercel-build`   | What Vercel runs: migrations under an advisory lock, then `next build` |
| `npm run db:generate`    | Writes a SQL migration from the schema in `src/lib/db/schema/`         |
| `npm run db:migrate`     | Applies migrations to the branch in `.env.local`                       |
| `npm run auth:generate`  | Regenerates the Better Auth schema (rerun after adding a plugin)       |
| `npm run db:setup-roles` | One time: creates `rubi_app` and `rubi_public` on `main`               |

## Layout

- `src/app`: routes only. Groups: `(marketing)` `/`, `(auth)` `/sign-in` `/sign-up`, `(dashboard)` `/app`, `(storefront)` `/s/[storeSlug]`.
- `src/features/<domain>`: services, queries, schemas, components.
- `src/lib`: `db` (pool, `withStore`, `withPublic`), `auth`, `env`, `logger`.
- `drizzle/`: committed SQL migrations. `scripts/`: migrate and role setup.
