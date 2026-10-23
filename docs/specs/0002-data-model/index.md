# 0002. Store scoped relational data model with row level security

**Date**: 2026-10-23
**Status**: Accepted

## Summary

This spec fixes the shape of Rubi's data: stores, products, variants, photos, customers, orders, order lines, an order history log, and later payments, categories and bank accounts. Every table carries the store it belongs to, and the database itself refuses to show one seller's rows to another (row level security, a rule Postgres checks on every query). Money is whole kobo, product prices and stock live on variants from day one, and a guest's order is written by one database function that checks prices and stock in a single step. Only the tables Slice 1 needs are created now; later slices add tables and columns without breaking anything.

## Requirements

**User stories**:
- As a seller, I want my catalog, orders and customers kept in one place so that I can run my business from Rubi.
- As a seller, I want certainty that no other seller can ever see or change my data.
- As a customer, I want to place an order without an account and be charged the price I saw.
- As the builder of later slices, I want the tables to already fit variants, payments, categories and customer history, so no slice needs a breaking migration.

**Acceptance criteria**:
- **AC-1**: The Slice 1 tables (`stores`, `store_slugs`, `products`, `product_variants`, `product_images`, `customers`, `orders`, `order_items`, `order_events`) exist through committed drizzle-kit migrations that `vercel-build` applies, and `drizzle-kit check` passes.
- **AC-2**: As `rubi_app` inside `withStore(A)`, every select, insert and update on a store scoped table sees and affects only store A rows; writing a row with store B's `store_id` fails; with no `app.store_id` set, store scoped tables return zero rows. This holds even when store B is published (the `rubi_public` policies never apply to `rubi_app`).
- **AC-3**: As `rubi_public`, a query sees only published stores, their slugs, their non archived products, the non archived variants and the images of those non archived products; it cannot read `owner_user_id`, `next_order_number`, customers, orders, order items or events, and cannot insert, update or delete any table directly.
- **AC-4**: `getSellerContext()` returns `{ userId, email, name, storeId }` for a signed in user who owns a store and redirects to `/app/setup` for one who does not; `getSignedInUser()` returns the user without requiring a store.
- **AC-5**: A user owns at most one store, and calling `createStore` again returns the existing store. A slug is unique across all stores, including retired slugs; `slug_available` answers for any slug without revealing whose it is; looking up a retired slug returns the store's current slug so the route can redirect; a store may take back its own retired slug.
- **AC-6**: All money is stored as `bigint` kobo. The database rejects an order whose total is not subtotal plus delivery fee minus discount, an order line whose line total is not unit price times quantity, and any negative amount.
- **AC-7**: `place_order` on a published store creates or updates the customer (matched by store and E.164 phone), the order with the store's next number, the order lines with a snapshot of name, variant label, unit price and image key, and a `placed` event, decrements tracked stock, and returns the order ID, number and total, all in one transaction.
- **AC-8**: `place_order` writes nothing and raises its named SQLSTATE when the store is unknown or unpublished, a variant or its product is archived or belongs to another store, tracked stock is short, any expected unit price differs from the current price (listing the current prices), or input breaks the caps (1 to 50 lines, no duplicate variant, quantity 1 to 999, the text length limits, valid E.164 phone, valid Nigerian state). Each error lists every failing item, and the checks run in a fixed order: store, availability, price, stock.
- **AC-9**: Calling `place_order` again with the same store and idempotency key returns the original order (even if the payload differs, or the store was unpublished since) and writes no new rows.
- **AC-10**: Concurrent orders on one store get distinct, gap free consecutive numbers starting at 1001, and two concurrent orders for the last unit of a tracked variant result in exactly one success.
- **AC-11**: `rubi_app` cannot delete rows from `stores`, `store_slugs`, `customers`, `orders`, `order_events`, `products` or `product_variants`; cannot update `order_events` or `store_slugs.slug`; and cannot update `stores.id`, `stores.owner_user_id` or `stores.next_order_number`.
- **AC-12**: Deleting a Better Auth user deletes their store and every row that belongs to it.
- **AC-13**: A product has at most one default variant (database enforced), and the product service always creates it in the same transaction as the product. Archiving a product hides it, its variants and its images from `rubi_public`, while its order lines still reference it.
- **AC-14**: `scripts/seed.ts` fills a non production branch with two sellers, their products and some orders, and refuses to run against the production branch or when its guard variable is unset.

## Decision

**Chosen option**: Option 1: Full target model, store scoped everywhere, Slice 1 migrated first

Every Rubi table carries `store_id` with RLS policies for `rubi_app` and `rubi_public`, prices and stock live on a default variant, order lines snapshot what was sold, guest orders go through one `SECURITY DEFINER` function, and the first migrations create only the Slice 1 tables of the target below.

**Implementation skills**: `neon-postgres` (`neondatabase/agent-skills`, `.claude/skills/neon-postgres/`) · `neon-postgres-branches` (`neondatabase/agent-skills`, `.claude/skills/neon-postgres-branches/`) · `better-auth-best-practices` (`better-auth/skills`, `.claude/skills/better-auth-best-practices/`) · `vitest` (`antfu/skills`, `.claude/skills/vitest/`)

## Feature design

### Conventions for every table

- **IDs**: `uuid` primary keys from a SQL function `uuid_generate_v7()` (time ordered uuid, created in the first migration because Neon project `rubi` runs Postgres 17, which has no native `uuidv7()`), used as the column default. Only `stores.owner_user_id` and `*_user_id` columns are `text`, to match Better Auth's `user.id`.
- **Money**: `bigint` kobo in columns named `*_kobo`, Drizzle `mode: "number"` (safe up to about ₦90 trillion). NGN is implied; a `currency` column is added only if another currency ever appears.
- **Fixed value sets**: `text` with a `CHECK (col IN (...))` constraint, typed in Drizzle as a TypeScript union. Adding a value is one migration that swaps the check.
- **Time**: `timestamptz` (UTC), `created_at` default `now()`, `updated_at` via Drizzle `$onUpdate`; display in `Africa/Lagos`.
- **Tenant column**: every table except `stores` has `store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE`, child tables included, so every policy is one column comparison with no joins. Every such table has an index whose first column is `store_id` (RLS filters and cascades use it).
- **Text limits** (public input, CHECK plus Zod): customer name 1 to 100, email up to 254, city 1 to 80, address 1 to 300, landmark up to 150, note up to 500 characters.
- **Price ceiling**: `price_kobo <= 10000000000` (₦100,000,000). With at most 999 per line and 50 lines, every total stays far below `Number.MAX_SAFE_INTEGER`, so Drizzle `mode: "number"` is safe.
- **Defaults**: `position` columns default to 0.
- **Phones**: E.164 (`+2348012345678`), normalised in the shared Zod schema with `libphonenumber-js` (`min` metadata, server side), and checked in SQL with `~ '^\+[1-9][0-9]{7,14}$'`.
- **Archiving**: products and variants are never deleted by the app; `archived_at` hides them.
- **Schema files**: `src/lib/db/schema/stores.ts`, `catalog.ts`, `orders.ts` (and `payments.ts` in Slice 3), re-exported from `index.ts`. Policies are declared in the Drizzle schema with `pgPolicy` and `pgRole('rubi_app').existing()` / `pgRole('rubi_public').existing()`, so `drizzle-kit check` sees them. The uuid function, `place_order`, column grants and revokes live in custom migrations (`drizzle-kit generate --custom`).

**Data model sketch** (✱ = created in Slice 1 by this feature; other rows are the agreed target, added by the slice named):

| Table | Columns (type, null) | Keys and relationships | Constraints and indexes |
|---|---|---|---|
| `stores` ✱ | `id uuid`; `owner_user_id text`; `name text`; `slug text`; `published_at timestamptz?`; `next_order_number integer` default 1001; `created_at`; `updated_at`. Later: `whatsapp_phone text?` (S2); `description text?`, `logo_key text?`, `banner_key text?`, `instagram_handle text?`, `tiktok_handle text?` (S6) | `owner_user_id` → `user.id` ON DELETE CASCADE; `slug` → `store_slugs.slug` (DEFERRABLE INITIALLY DEFERRED, so both rows are written in one transaction) | unique `owner_user_id`; unique `slug`; `char_length(name) BETWEEN 1 AND 80`; slug matches `^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$` |
| `store_slugs` ✱ | `slug text` PK; `store_id uuid`; `created_at`; `retired_at timestamptz?` | → `stores` | partial unique (`store_id`) WHERE `retired_at IS NULL`. Holds every slug ever used (current and retired); the PK makes a slug unique across all stores forever. A rename retires the current row and inserts the new one, or clears `retired_at` when the store takes back its own old slug |
| `products` ✱ | `id`; `store_id`; `name text`; `slug text`; `description text?`; `archived_at?`; `created_at`; `updated_at`. Later: `category_id uuid?` (S5), `option_names text[]` default `'{}'` (S5) | → `stores`; later → `categories` ON DELETE SET NULL | unique (`store_id`, `slug`); index (`store_id`, `archived_at`, `created_at` DESC); name 1 to 120 chars |
| `product_variants` ✱ | `id`; `store_id`; `product_id`; `price_kobo bigint`; `stock integer?` (null = not tracked); `is_default boolean`; `position integer`; `archived_at?`; `created_at`; `updated_at`. Later: `option_values text[]` default `'{}'` (S5) | → `products` ON DELETE CASCADE | `price_kobo BETWEEN 1 AND 10000000000`; `stock >= 0`; partial unique (`product_id`) WHERE `is_default`; index (`product_id`); index (`store_id`); later unique (`product_id`, `option_values`) WHERE `archived_at IS NULL` |
| `product_images` ✱ | `id`; `store_id`; `product_id`; `r2_key text`; `width integer`; `height integer`; `position integer`; `created_at` | → `products` ON DELETE CASCADE | unique (`product_id`, `position`); index (`store_id`); Slice 1 service allows one image |
| `categories` (S5) | `id`; `store_id`; `name text`; `position integer`; timestamps | → `stores` | unique (`store_id`, `lower(name)`) |
| `customers` ✱ | `id`; `store_id`; `phone text?`; `name text`; `email text?`; `anonymised_at?`; `created_at`; `updated_at` | → `stores` | partial unique (`store_id`, `phone`) WHERE `phone IS NOT NULL`; phone E.164 check |
| `orders` ✱ | `id`; `store_id`; `number integer`; `idempotency_key uuid`; `customer_id uuid`; `status text` default `new`; `payment_status text` default `unpaid`; `customer_name text`; `customer_phone text?`; `customer_email text?`; `delivery_state text`; `delivery_city text`; `delivery_address text`; `delivery_landmark text?`; `delivery_note text?`; `subtotal_kobo`; `delivery_fee_kobo` default 0; `discount_kobo` default 0; `total_kobo`; `created_at`; `updated_at` | → `stores`; `customer_id` → `customers` (NO ACTION) | unique (`store_id`, `number`); unique (`store_id`, `idempotency_key`); `status IN ('new','confirmed','delivered','cancelled')`; `payment_status IN ('unpaid','part_paid','paid','refunded')`; all `*_kobo >= 0`; `total_kobo = subtotal_kobo + delivery_fee_kobo - discount_kobo`; `delivery_state` in the state list below; the text limits above; indexes (`store_id`, `created_at` DESC, `id`), (`store_id`, `status`, `created_at` DESC), (`store_id`, `payment_status`), (`customer_id`) |
| `order_items` ✱ | `id`; `store_id`; `order_id`; `variant_id uuid?`; `product_id uuid?`; `product_name text`; `variant_label text?`; `image_key text?`; `unit_price_kobo bigint`; `quantity integer`; `line_total_kobo bigint`; `created_at` | → `orders` ON DELETE CASCADE; `variant_id`, `product_id` ON DELETE SET NULL | `quantity BETWEEN 1 AND 999`; `unit_price_kobo >= 0`; `line_total_kobo = unit_price_kobo * quantity`; index (`order_id`); index (`store_id`) |
| `order_events` ✱ | `id`; `store_id`; `order_id`; `type text`; `from_status text?`; `to_status text?`; `actor text`; `actor_user_id text?`; `note text?`; `created_at` | → `orders` ON DELETE CASCADE | `type IN ('placed','status_changed','edited','payment_recorded','payment_voided','note')`; `actor IN ('customer','seller','system')`; index (`order_id`, `created_at`); index (`store_id`) |
| `payments` (S3) | `id`; `store_id`; `order_id`; `kind text`; `amount_kobo bigint`; `method text`; `paid_at timestamptz`; `note text?`; `provider text?`; `provider_reference text?`; `recorded_by_user_id text?`; `voided_at?`; `created_at` | → `orders` ON DELETE CASCADE | `kind IN ('payment','refund')`; `amount_kobo > 0`; `method IN ('bank_transfer','cash','pos','other')` (card added with online checkout); partial unique (`provider`, `provider_reference`) WHERE `provider IS NOT NULL` |
| `store_payout_accounts` (S3) | `id`; `store_id`; `bank_name text`; `account_number text`; `account_name text`; `is_default boolean`; timestamps | → `stores` | `account_number ~ '^[0-9]{10}$'`; partial unique (`store_id`) WHERE `is_default` |

**Delivery states** (exact spellings, shared by the CHECK and a `NIGERIAN_STATES` constant in `src/features/orders`): Abia, Adamawa, Akwa Ibom, Anambra, Bauchi, Bayelsa, Benue, Borno, Cross River, Delta, Ebonyi, Edo, Ekiti, Enugu, FCT, Gombe, Imo, Jigawa, Kaduna, Kano, Katsina, Kebbi, Kogi, Kwara, Lagos, Nasarawa, Niger, Ogun, Ondo, Osun, Oyo, Plateau, Rivers, Sokoto, Taraba, Yobe, Zamfara.

Deferred features fit without breaking changes: expenses (new `expenses` table), online checkout (`payments.provider*`, a `card` method value), custom domains (new `store_domains`), staff accounts (new `store_members`; `owner_user_id` stays), subscriptions (new table or `stores.plan`), delivery tracking (new columns or table on orders).

**State transitions**:

- `orders.status`: `new → confirmed → delivered`; `new → cancelled`; `confirmed → cancelled`. `delivered` and `cancelled` are final. Cancelling restocks tracked variants. Each change writes an `order_events` row (`status_changed`). Enforced in the Slice 3 order service; the database checks only the value set.
- `orders.payment_status` (Slice 3): recomputed in the same transaction as every payment insert or void, from the non voided payments: sum of payments minus refunds `= 0` → `unpaid` (or `refunded` when a refund exists); `< total` → `part_paid`; `>= total` → `paid`. Stored, not computed per read, because the inbox filters on it.
- Line edits (Slice 3): allowed while `status IN ('new','confirmed')`; the service recomputes `subtotal_kobo` and `total_kobo`, adjusts tracked stock and writes an `edited` event, in one `withStore` transaction.

**API surface** (data layer functions; no HTTP endpoints):

| Function | Kind | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `withStore(storeId, fn)` (exists) | `src/lib/db` | `storeId` from `getSellerContext()` | `fn` result | seller session | RLS hides other stores' rows; a foreign `store_id` insert fails the policy check |
| `withUser(userId, fn)` (new) | `src/lib/db` | `userId` from the session | `fn` result | seller session | sets `app.user_id` only; used to find or create the user's store |
| `withNewStore(userId, fn)` (new) | `src/lib/db` | `userId` from the session | `fn(tx, storeId)` result | seller session | setup only: gets a fresh id from `uuid_generate_v7()`, sets both `app.user_id` and `app.store_id`, so the store and its first `store_slugs` row are written under the normal policies |
| `slug_available(p_slug text)` | SQL, `SECURITY DEFINER` | slug | `boolean` | `rubi_app` EXECUTE only | true when no `store_slugs` row has it (current or retired); reveals nothing else |
| `createStore(input)` | `src/features/stores` | name, slug from the setup form | `Result<{ storeId, slug }, 'slug_taken' \| 'invalid'>` | `getSignedInUser()` | a user who already has a store gets that store back (ok); a lost slug race (PK violation) maps to `slug_taken` |
| `withPublic(fn)` (exists) | `src/lib/db` | none | `fn` result | public | read only; writes fail |
| `withCheckout(fn)` (new) | `src/lib/db` | none | `fn` result | public | read write transaction with `SET LOCAL ROLE rubi_public`; the only writable thing is `place_order` |
| `getSellerContext()` | `src/lib/auth/session.ts`, wrapped in React `cache()` (one store lookup per request) | session headers | `{ userId, email, name, storeId }` | signed in, owns a store | redirects to `/sign-in` (no session) or `/app/setup` (no store) |
| `getSignedInUser()` (new) | `src/lib/auth/session.ts` | session headers | `{ userId, email, name }` | signed in | redirects to `/sign-in` |
| `place_order(p_store_slug text, p_idempotency_key uuid, p_customer jsonb, p_delivery jsonb, p_items jsonb)` | SQL, `SECURITY DEFINER`, `SET search_path = pg_catalog, pg_temp` (every name schema qualified) | customer `{name, phone, email?}`; delivery `{state, city, address, landmark?, note?}`; items `[{variant_id, quantity, expected_unit_price_kobo}]` | `jsonb {order_id, number, total_kobo, store_id, store_slug, product_ids, existing: boolean}` | `rubi_public` EXECUTE only (revoked from PUBLIC) | custom SQLSTATEs: `RB001` store_unavailable, `RB002` item_unavailable, `RB003` price_changed, `RB004` out_of_stock, `RB005` invalid_input. `DETAIL` is a JSON array of `{variant_id, current_price_kobo?, available?}` for every failing item (or `{field}` for `RB005`) |
| `placeOrder(input)` | `src/features/orders/place-order.ts` | the checkout form, parsed by the shared Zod schema | `Result<{ orderId, number, totalKobo }, PlaceOrderError>` | public | maps `error.code` (`RB001` to `RB005`) to the typed error and parses `error.detail` with a Zod schema; calls `updateTag` for `store:<store_id>` and each `product:<id>` in `product_ids` when stock was tracked; feature 7 adds the IP rate limit |
| `resolveStoreSlug(slug)` | `src/features/stores/storefront.ts` | slug | `{ storeId, currentSlug, retired }` or `notFound()` | public, cached, tags `store-slug:<slug>` and `store:<id>` | unknown or unpublished slug → `notFound()` |

`place_order` steps, in order (every name inside the function is schema qualified, e.g. `public.stores`):
1. Validate the caps (`RB005`), including duplicate `variant_id` lines (the cart merges them before submit).
2. Resolve `p_store_slug` through `store_slugs` (current or retired) to a `store_id`, and lock the store row with `SELECT ... FOR NO KEY UPDATE`. `FOR NO KEY UPDATE` serialises orders per store without blocking the foreign key checks of other inserts. Unknown slug → `RB001`.
3. If an order with this `(store_id, idempotency_key)` exists, return it with `existing: true` and stop. This runs before the published check, so a retry always finds its order.
4. If `published_at IS NULL` → `RB001`.
5. Load the variants joined to their products. Then check availability (variant missing, in another store, or variant or product archived → `RB002`), then prices (`RB003`), then stock (`RB004`). Each check collects every failing item before raising.
6. Decrement tracked stock in `variant_id` order: `UPDATE ... SET stock = stock - q WHERE id = $1 AND (stock IS NULL OR stock >= q)`. Zero rows (lost a race) → `RB004`. Lock order is always the store, then variants by id. Seller transactions that lock variants must never lock the store row afterwards.
7. Bump the counter: `UPDATE stores SET next_order_number = next_order_number + 1 ... RETURNING next_order_number - 1`.
8. Upsert the customer: `ON CONFLICT (store_id, phone) WHERE phone IS NOT NULL DO UPDATE SET email = coalesce(customers.email, excluded.email)`. The existing name and email are never overwritten, because a guest's phone is unverified. The order keeps what the guest typed.
9. Insert the order, the lines (snapshot image = the product's lowest `position` image) and the `placed` event, then return.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| any dashboard read or write | `storeId` | `getSellerContext()`, which reads `stores.id` where `owner_user_id` = session user, inside `withUser` |
| store setup | `owner_user_id` | the session user ID via `getSignedInUser()` |
| store setup | store `id`, slug row | `uuid_generate_v7()` called by `withNewStore`; slug from the setup form (rules and reserved list decided in the Seller sign up spec), checked live with `slug_available` |
| storefront slug lookup | current slug for a retired one | `store_slugs.store_id` → `stores.slug` |
| `place_order` | `store_id` | `store_slugs.store_id` looked up from `p_store_slug` (current or retired), never client input |
| `placeOrder` | tags to invalidate | `store_id`, `store_slug`, `product_ids` returned by `place_order` |
| `place_order` | order `number` | `stores.next_order_number`, read and bumped under the row lock |
| `place_order` | `unit_price_kobo`, `product_name`, `image_key` | `product_variants.price_kobo`, `products.name`, the product's `product_images` row with the lowest `position` (null if none), read inside the function |
| `place_order` | `variant_label` | null for a default variant; from Slice 5, `option_values` joined with ` / ` |
| `place_order` | `line_total_kobo`, `subtotal_kobo`, `total_kobo` | `unit_price_kobo * quantity`; sum of line totals; subtotal + `delivery_fee_kobo` (0 at placement) − `discount_kobo` (0 at placement) |
| `place_order` | `customer_id` | the customer upsert keyed on (`store_id`, normalised phone); a new customer takes the typed name, an existing one keeps its name |
| `place_order` | normalised phone | `libphonenumber-js` in the shared Zod schema (region `NG`), checked again by the SQL regex |
| `place_order` | `idempotency_key` | a `crypto.randomUUID()` the checkout form creates once when it mounts, sent as a hidden field |
| `place_order` | `price_changed` detail | the current `price_kobo` per variant, read inside the function |
| order event | `actor`, `actor_user_id` | `customer` with null for `place_order`; `seller` with `getSellerContext().userId` for dashboard actions |
| order list | page order | keyset pagination on (`created_at` DESC, `id` DESC), cursor from the last row |
| any displayed money | naira string | `kobo / 100` formatted with `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })` in one shared `formatNaira` helper |
| any displayed time | local time | `timestamptz` rendered in the constant `Africa/Lagos` |
| `payment_status` (S3) | status | sum over non voided `payments`, compared to `orders.total_kobo` |

**Key invariants**:
- One store per user (`unique owner_user_id`); a slug, once used, belongs to that store forever (`store_slugs` PK); `stores.slug` always points at an existing `store_slugs` row (deferred FK), and the rename service keeps it equal to the row whose `retired_at IS NULL`.
- `total_kobo = subtotal_kobo + delivery_fee_kobo - discount_kobo` and `line_total_kobo = unit_price_kobo * quantity` (CHECK). `subtotal_kobo` equals the sum of line totals: kept by `place_order` and the Slice 3 edit service, and covered by a test.
- At most one default variant per product (partial unique index), and the product service always creates it in the same transaction as the product, so in practice there is exactly one.
- Tracked stock never goes below zero (CHECK plus the conditional update).
- `(store_id, number)` and `(store_id, idempotency_key)` are unique.
- Every row's `store_id` matches its parent's `store_id`: the services copy it from the parent, and the RLS `WITH CHECK` ensures it is the current store.
- Order history is append only: no UPDATE or DELETE on `order_events` for `rubi_app`.

**Security model**:
- **Roles**: migrations run as the owner role; runtime is `rubi_app` (no `BYPASSRLS`); storefront reads and checkout switch to `rubi_public`. Tables are not `FORCE ROW LEVEL SECURITY`, so the owner (and the definer functions it owns) bypasses RLS on purpose.
- **Role membership without inheritance** (first custom migration, and the same change in `scripts/setup-roles.ts`): `REVOKE rubi_public FROM rubi_app; GRANT rubi_public TO rubi_app WITH INHERIT FALSE, SET TRUE`. Postgres applies a role's policies and grants to members that inherit it; with inheritance on, `rubi_app` inside `withStore(A)` would also pass the `rubi_public` policies and see every published store's catalog. With `INHERIT FALSE`, `rubi_app` can still `SET LOCAL ROLE rubi_public` but gets none of its rights otherwise. Neon copies roles into a branch when it is created, so the migration (not only the script) is what fixes existing branches.
- **Every policy names its role**: `rubi_app` policies are `TO rubi_app`, public ones `TO rubi_public`; no policy is left `TO PUBLIC`. Settings are read as `(select nullif(current_setting('app.store_id', true), '')::uuid)`, so Postgres evaluates them once per query, not once per row.
- **`rubi_app` policies** on every store scoped table: `USING (store_id = <app.store_id>)` with the same `WITH CHECK`. On `stores`: `USING (id = <app.store_id> OR owner_user_id = (select nullif(current_setting('app.user_id', true), '')))`, and INSERT `WITH CHECK (owner_user_id = <app.user_id>)`.
- **`rubi_app` grant changes** (custom migration, after the default privileges from `setup-roles.ts`): `REVOKE DELETE ON stores, store_slugs, customers, orders, order_events, products, product_variants FROM rubi_app`; `REVOKE UPDATE ON order_events, store_slugs FROM rubi_app` then `GRANT UPDATE (retired_at) ON store_slugs TO rubi_app`; `REVOKE UPDATE ON stores FROM rubi_app` then `GRANT UPDATE (name, slug, published_at, updated_at) ON stores TO rubi_app` (later slices add their columns to this grant). The order counter is changed only inside `place_order`. Seller erasure works because cascades run as the table owner. `payments` (S3) gets `REVOKE DELETE` too; a mistaken payment is voided with `voided_at`. `order_items` keeps DELETE for line edits (Slice 3 decides whether to narrow it).
- **Definer functions** (`place_order`, `slug_available`): owned by the migration owner, `SET search_path = pg_catalog, pg_temp`, every name schema qualified, `REVOKE EXECUTE ... FROM PUBLIC`, then `GRANT EXECUTE` to exactly one role.
- **`rubi_public` grants**: column level `SELECT` only. `stores (id, name, slug, published_at)` plus the S2 and S6 public columns when they land; `store_slugs (slug, store_id, retired_at)`; `products (id, store_id, name, slug, description, archived_at)` plus `category_id`, `option_names` in S5; `product_variants (id, store_id, product_id, price_kobo, stock, is_default, position, archived_at)` plus `option_values` in S5; `product_images (all columns)`; in S3, `store_payout_accounts (store_id, bank_name, account_number, account_name, is_default)`. No grant at all on `customers`, `orders`, `order_items`, `order_events`, `payments`. `EXECUTE ON FUNCTION place_order` (revoked from `PUBLIC`).
- **`rubi_public` policies**: `stores USING (published_at IS NOT NULL)`; `store_slugs`, `products`, `product_variants`, `product_images` (and payout accounts with `is_default`) `USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.published_at IS NOT NULL))`, plus `archived_at IS NULL` on products and variants, and on `product_variants` and `product_images` also `EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.archived_at IS NULL)`. Storefront queries name their columns (no `select *`). Exact `stock` stays public on purpose (it lets the storefront say "only 2 left").
- **Compliance (NDPA, Nigeria Data Protection Act)**: customer name, phone, email and address are personal data. Erasure of a seller = `DELETE FROM "user"` cascading through `stores`. Erasure of a customer (built in Slice 7 or feature 17) = anonymise: `customers.phone/email = null`, `name = 'Deleted customer'`, `anonymised_at = now()`, and on that customer's orders `customer_name = 'Deleted customer'`, `customer_phone/email = null`, `delivery_address = '[removed]'`, `delivery_landmark/note = null`; amounts, lines, state and city stay. Logs carry IDs only, never names, phones or addresses. `order_events` is the audit trail for order and money changes.

**Configuration required**:
- `NEON_MAIN_ENDPOINT_ID`: the endpoint ID (`ep-...`) of the production `main` branch. `scripts/seed.ts` fails closed: it refuses to run when the variable is unset, when `PGHOST` or `DATABASE_URL_UNPOOLED` contains it, or when `VERCEL_ENV=production`. Optional in the app's env schema (the app never reads it), required by the seed script, listed in `.env.example`.
- New dependencies: `libphonenumber-js`.

**Critical test scenarios**:
- Happy path: seed two stores, place an order on store A as `rubi_public` through `withCheckout`, then read it back as `rubi_app` in `withStore(A)` with number 1001, snapshot lines, a `placed` event and decremented stock, verifies **AC-1**, **AC-7**, **AC-13**
- Isolation: with store B published, in `withStore(A)`, select every store scoped table and see only A's rows; try to insert a product with B's `store_id` and get a policy error; with no setting, see zero rows, verifies **AC-2**
- Public surface: as `rubi_public`, an unpublished store, an archived product and its variants and images, `owner_user_id`, and `select` on `orders` all return nothing or a permission error; any insert fails, verifies **AC-3**
- Context: a user without a store is redirected to `/app/setup`; with a store, `storeId` is returned, verifies **AC-4**
- Slugs: a second store cannot take a retired slug and `slug_available` returns false for it; a retired slug resolves to the current one; the owner can take its own retired slug back; a second `createStore` returns the first store, verifies **AC-5**
- Money: inserting an order whose total does not add up fails the CHECK, verifies **AC-6**
- Rejections: unpublished store, foreign variant, archived variant, archived product, duplicate line, short stock, stale expected price, 51 lines, a 301 character address: each raises its SQLSTATE with every failing item in `DETAIL`, and the row counts are unchanged, verifies **AC-8**
- Idempotency: the same key twice (second time with a different payload, after unpublishing) returns the same `order_id` with `existing: true`, and the counter is not bumped, verifies **AC-9**
- Customer safety: a second order with a known phone and a different name leaves the customer's stored name unchanged, verifies **AC-7**
- Concurrency: 20 parallel `place_order` calls on one store yield numbers 1001 to 1020 with no gaps; two parallel orders for a variant with `stock = 1` yield one success and one `out_of_stock`, verifies **AC-10**
- Grants: as `rubi_app`, `DELETE FROM orders`, `DELETE FROM store_slugs`, `UPDATE order_events` and `UPDATE stores SET owner_user_id = ...` raise permission errors, verifies **AC-11**
- Erasure: deleting a seeded user leaves zero rows with that `store_id` in every table, verifies **AC-12**
- Seed guard: running the seed with `PGHOST` set to the main endpoint, or with `NEON_MAIN_ENDPOINT_ID` unset, exits non zero before writing, verifies **AC-14**

## Build plan

Tracer Bullet: the first milestone proves one real thread (session, store, RLS) through every layer; each later milestone thickens one segment and ships end to end. Each milestone is its own expand only migration.

**Milestone 1: Store thread (session → store → RLS)**
1. Custom migration: `uuid_generate_v7()` SQL function, and the role membership fix (`GRANT rubi_public TO rubi_app WITH INHERIT FALSE, SET TRUE`); mirror the grant in `scripts/setup-roles.ts`, satisfies **AC-1**, **AC-2**
2. `src/lib/db/schema/stores.ts`: `stores` and `store_slugs` with constraints, the deferred slug FK, indexes and `TO rubi_app` policies (`pgPolicy`); generate and commit the migration; custom migration for the `stores` and `store_slugs` grant changes and `slug_available`, satisfies **AC-1**, **AC-2**, **AC-5**, **AC-11**, **AC-12**
3. Add `withUser` and `withNewStore` to `src/lib/db/index.ts`, satisfies **AC-2**, **AC-4**
4. `getSellerContext()` returns `storeId` (lookup in `withUser`, wrapped in React `cache()`, redirect to `/app/setup` when missing); add `getSignedInUser()`; replace the TODO in `src/lib/auth/session.ts`, satisfies **AC-4**
5. A minimal `createStore` service in `src/features/stores` (store row plus current `store_slugs` row in one `withNewStore` transaction, existing store returned on repeat, PK violation mapped to `slug_taken`) so the thread runs end to end; the real setup UI comes with feature 5, satisfies **AC-4**, **AC-5**

**Milestone 2: Catalog and public reads**
6. `src/lib/db/schema/catalog.ts`: `products`, `product_variants`, `product_images` with checks, indexes, the default variant partial unique index, and `rubi_app` policies; migration, satisfies **AC-1**, **AC-2**, **AC-13**
7. Custom migration: `rubi_public` column grants and `TO rubi_public` policies on `stores`, `store_slugs`, `products`, `product_variants`, `product_images` (variants and images also check the product is not archived); revoke DELETE on `products`, `product_variants`, satisfies **AC-3**, **AC-11**, **AC-13**
8. Replace the placeholder in `src/features/stores/storefront.ts` with `resolveStoreSlug` reading a published store through `withPublic` (current and retired slugs, tags `store-slug:<slug>` and `store:<id>`), satisfies **AC-3**, **AC-5**

**Milestone 3: Orders and checkout**
9. `src/lib/db/schema/orders.ts`: `customers`, `orders`, `order_items`, `order_events` with checks (money, totals, statuses, states, text limits), indexes and `TO rubi_app` policies; migration, satisfies **AC-1**, **AC-2**, **AC-6**
10. Custom migration: `place_order` function (steps above, `SECURITY DEFINER`, fixed `search_path`, schema qualified names, `RB001` to `RB005`, `REVOKE ... FROM PUBLIC`, `GRANT EXECUTE TO rubi_public`); revoke DELETE on `customers`, `orders`, `order_events` and UPDATE on `order_events`, satisfies **AC-7**, **AC-8**, **AC-9**, **AC-10**, **AC-11**
11. `withCheckout` in `src/lib/db`; `placeOrder` in `src/features/orders` with the shared Zod schema (`libphonenumber-js`, `NIGERIAN_STATES`, caps and text limits), SQLSTATE and `DETAIL` mapping to a typed result, and `updateTag` from the returned IDs; `formatNaira` helper, satisfies **AC-6**, **AC-7**, **AC-8**, **AC-9**

**Milestone 4: Seed data and isolation checks**
12. `scripts/seed.ts` (`npm run db:seed`): two sellers created through Better Auth's server API, published stores, products with default variants (some with tracked stock), and orders placed through `place_order`; a fail closed guard on `NEON_MAIN_ENDPOINT_ID` and `VERCEL_ENV`; add the variable to `.env.example` and `src/lib/env`, satisfies **AC-14**
13. Run every critical test scenario on the dev branch as `rubi_app` and `rubi_public` (by script or Vitest once `/test` installs it) and fix gaps, satisfies **AC-2**, **AC-3**, **AC-10**, **AC-11**, **AC-12**

Later slices add, each in its own expand migration: `stores.whatsapp_phone` (S2); `payments`, `store_payout_accounts` and the `rubi_public` payout grant (S3); `categories`, `products.category_id`, `option_names`, `option_values` (S5); branding columns (S6).

## Consequences

**Positive**:
- Seller isolation is enforced by Postgres on every table, so a forgotten filter in a query cannot leak another seller's data.
- Variants, multiple photos, payments and categories all fit the shapes created now; later slices only add.
- Orders are immutable records: snapshots, an append only log, and no deletes keep sales history and future insights honest.
- Checkout is one atomic database call that cannot be tricked into a wrong price, a foreign store or negative stock, and is safe to retry.

**Negative / tradeoffs**:
- `place_order` is business logic in PL/pgSQL, outside TypeScript: harder to read, test and refactor, and it must be changed by migration. Keep it small and covered by tests.
- Every store has a per store counter row lock: orders on one store are serialised. Fine for small sellers; a viral store at hundreds of orders per second would queue.
- `store_id` on child tables duplicates the parent's value; services must copy it correctly (RLS catches a wrong store, not a mismatched parent).
- Column level grants mean storefront queries must name columns, and every new public column needs a grant migration.
- Retired slugs are held forever, so popular names stay taken once used.
- `payment_status` is a stored derived value; a bug in the recompute path would show a wrong status.
- Policies, grants and functions all live partly outside Drizzle's normal table diff, and `drizzle-kit check` does not validate custom SQL. Reviewers must read the custom migrations, and the RLS and grant tests are the only real guard, so they must run in CI.
- A guest can still drain tracked stock or burn order numbers with junk orders until feature 7's IP rate limit ships. That limit must be in place before any storefront is shared publicly.

**Neutral**:
- When the Neon project moves to Postgres 18, swap the `uuid_generate_v7()` default for native `uuidv7()` in one migration.
- `libphonenumber-js` is a new dependency (about 80 KB, server side only).
- `getSellerContext()` now needs one indexed query per request to find the store.

## Follow-up

- [ ] Seller sign up spec (feature 5): slug rules, the reserved slug list, the preconditions for setting `published_at` and the publish step UI, and whether a rename is allowed in the MVP.
- [ ] Add a product spec (feature 6): product slug generation (from the name, `-2` on a clash, never changed) and the archive UX.
- [ ] Public storefront spec (feature 7): the IP rate limit on `placeOrder` (required before any store is shared), whether to add a per store cap on unconfirmed orders, and the UX for each `RB00x` error.
- [ ] Order status spec (feature 10): the status change and line edit services (lock variants by id and never the store row afterwards), who sets `delivery_fee_kobo` and `discount_kobo` and when, payment recording and voiding, the `payment_status` recompute, and whether to narrow DELETE on `order_items`.
- [ ] Legal spec (feature 17): a grace period before seller erasure, the customer anonymise action, and the seller data export.
- [ ] Vitest is not installed yet; `/test` should install it and turn the critical test scenarios into the RLS suite that runs as `rubi_app` on a throwaway CI branch.
- [ ] `/sync`: add the data model rules to root `AGENTS.md` (money as `*_kobo` bigint, `store_id` on every table, column grants for `rubi_public`, no deletes on orders).

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
