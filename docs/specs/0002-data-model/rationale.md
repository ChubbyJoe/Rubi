# 0002. Data model: rationale

Decision record for [index.md](index.md). `/develop` builds from the index; this file explains why.

## Context

Rubi serves small Nigerian sellers who take orders through WhatsApp, Instagram and TikTok. Every planned slice (catalog, storefront orders, cart, order status and manual payments, notifications, variants, branding, customer records, the "needs attention" home) reads or writes the same handful of entities, so their shape is load bearing: a wrong call here turns into a breaking migration on live seller data later. The scope promises that expenses, online payments and insights can be added later without one.

Spec 0001 already fixed the ground rules: Neon Postgres 17 in Frankfurt, Drizzle with committed SQL migrations, expand then contract, a runtime role `rubi_app` without `BYPASSRLS`, a read only `rubi_public` role for cached storefront reads, and a tenant contract where `storeId` only ever comes from the seller's session. It left four things to this spec: the RLS policies, the link from a Better Auth user to a store, the money type, and the ID type.

Three forces pull hardest. First, isolation: one seller seeing another's customers or orders would end trust in the product, and the data includes personal data under Nigeria's Data Protection Act. Second, money: totals must be exact and must not change after the fact, because sellers settle bank transfers against them and later insights sum them. Third, guest checkout: customers have no account, so an order is written from a public, unauthenticated path that still must not be able to pick a price, a store, or another store's product, on mobile networks where a tap is often retried.

The project is built by one person, Tracer Bullet style, so the first migration has to support a thin end to end thread now, while the target shape has to hold for eight slices.

## Options considered

### Option 1: Full target model, store scoped everywhere, Slice 1 migrated first

Design the complete relational target for slices 1 to 8 now: `store_id` on every table (child tables too) with RLS for both runtime roles, prices and stock on a default variant from day one, order lines that snapshot what was sold, an append only order event log, a payments table, and guest orders through one `SECURITY DEFINER` function. Migrate only the Slice 1 tables now.

**Pros**:
- No later slice needs a breaking change; each only adds.
- Every policy is a single column comparison, cheap and hard to get wrong.
- Checkout correctness (price, store, stock, numbering, retries) is enforced in one atomic place.

**Cons**:
- More tables and SQL up front than Slice 1 strictly needs.
- Business logic in PL/pgSQL, which is harder to test and refactor than TypeScript.
- `store_id` is duplicated on child rows.

### Option 2: Minimal Slice 1 tables, evolve per slice

Create just `stores`, `products` (with price and one image column) and `orders` with inline items, and let each later slice reshape them.

**Pros**:
- Fastest first slice, the least to review.
- No guessing about later slices.

**Cons**:
- Slice 5 must move price and stock out of `products` and rewrite order lines: exactly the breaking migration the scope rules out.
- Customer records and payments would need backfills from old orders, which are error prone.

### Option 3: Document heavy model (JSON columns)

Relational `stores`, `products`, `orders`, with variants, images and order lines stored as `jsonb` arrays.

**Pros**:
- Very flexible; fewer tables and joins.
- Matches how a single order "looks" when shown.

**Cons**:
- The database cannot enforce stock, foreign keys to variants, or per line totals.
- Reporting and insights need JSON unnesting everywhere.
- Concurrent stock updates on JSON are race prone.

For the guest write path specifically, three mechanisms were weighed: a `SECURITY DEFINER` function (chosen), a third TypeScript helper running as a new insert only role, and reusing `withStore` with a slug resolved `storeId`. The second keeps logic in TypeScript but adds a role and still lets the client influence prices unless every check is duplicated in RLS; the third breaks the "storeId only from the session" rule and gives a public path full store access.

## Rationale

Option 1 wins because the scope's promise of "no breaking migration later" is the binding force, and only Option 1 checks it slice by slice before any data exists. Each later slice's change was traced: variants (rows on an existing table), photos (lift a service limit), payments and bank details (new tables), categories (a nullable column and a table), customer history (rows already linked from the first order), insights (sums over stored kobo and an event log). Option 2's cost lands at Slice 5 on live data; Option 3 gives up the database guarantees that matter most for money and stock.

Putting `store_id` on child tables trades a little duplication for policies that never need a join, which keeps RLS cheap on the Frankfurt round trip that spec 0001 already flags, and makes "a forgotten filter cannot leak data" true for every table, not just the top level ones. Column level grants for `rubi_public` were preferred over views because new public columns are rare and a grant is one line, while views would need rewriting for every new column. Order deletion is removed from the runtime role entirely, because a cancelled order is still history and the event log is the audit trail for money.

The `SECURITY DEFINER` function is the one place that is not TypeScript. It earns that because the checkout must be atomic across five tables (customer, order, lines, event, stock) and the counter, must ignore any client price, and must be idempotent under retries. Doing it in the database means the public role needs no write grant on any table at all. The counter row lock serialises one store's orders, which is the right trade for small sellers: gap free order numbers they can read out on WhatsApp, at a throughput far above what any MVP store will see.

Smaller calls: uuid v7 from a SQL function, because Neon project `rubi` is on Postgres 17, IDs must also be generated inside `place_order`, and time ordered keys keep indexes compact (runner up: app generated v7 with the `uuid` package). `bigint` kobo over `integer`, because ₦21 million caps out on a yearly total. `text` with CHECK over Postgres enums, because adding or removing a value fits expand then contract without `ALTER TYPE` caveats. `libphonenumber-js` over a hand written regex, because Nigerian prefixes change and phone is the customer match key. Policies live in the Drizzle schema (`pgPolicy`) so `drizzle-kit check` covers them, while functions and grants, which drizzle-kit does not model, go in custom migrations (runner up: all security in custom SQL).

### Recommendations made while writing (not asked)

| Call | Pick | Why | Runner up |
|---|---|---|---|
| Finding a store before `storeId` is known | `withUser(userId)` sets `app.user_id`; `stores` policy also matches `owner_user_id`; setup uses `withNewStore`, which picks the id first and sets both settings | Keeps RLS on `stores` and `store_slugs` without a definer function for setup | A `create_store` definer function |
| Customer upsert on repeat orders | keep the stored name and email, only fill empty fields | A guest's phone is unverified, so a stranger must not be able to rename a seller's customer; the order keeps what was typed | Latest input wins |
| Role membership | `rubi_public` granted to `rubi_app` with `INHERIT FALSE, SET TRUE` | Otherwise `rubi_public`'s policies apply to `rubi_app` too and published stores leak across tenants | Separate login roles with no membership |
| Store row lock in `place_order` | `FOR NO KEY UPDATE`, store then variants by id | `FOR UPDATE` would block other inserts' FK checks and could deadlock with restocks | `FOR UPDATE` |
| Errors from `place_order` | custom SQLSTATEs `RB001` to `RB005` with JSON `DETAIL` | Codes are stable; message strings are not | `P0001` with a message code |
| Slug availability | `slug_available` definer function | RLS hides other stores' slugs from `rubi_app` | Insert and catch the PK violation |
| Child row `store_id` | copied from parent by services | Policies stay join free | Composite foreign keys (`store_id`, `id`) |
| Pagination | keyset on (`created_at`, `id`) | Stable under inserts, cheap with the index | Offset |
| Delivery state | CHECK on the 36 states plus FCT, shared TS constant | The list is fixed; filters and fees rely on it | Free text |
| Removing a payment | `voided_at` | Money history stays auditable | DELETE |
| `payment_status` | stored, recomputed in the same transaction | The inbox filters by it | Computed per read |
| Seed guard | `NEON_MAIN_ENDPOINT_ID` (required, fails closed) plus `VERCEL_ENV` | Database names are the same on every branch | A marker table |

### Cross check (2026-10-23)

An independent review on another model found 15 issues; all were applied with the engineer's approval. The most important: the `rubi_public` role membership leaked published catalogs into `rubi_app` (fixed with `INHERIT FALSE`), the store lock could deadlock (now `FOR NO KEY UPDATE`), the customer upsert let a guest overwrite a stored name, the public policies showed archived products' variants and images, and several DELETE and UPDATE grants were too wide.
