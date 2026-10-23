# Verify: Data model · spec 0002 · updated 2026-10-23

_Steps derived from spec 0002 acceptance criteria and its Value sourcing table. `/check verify` runs these; `/test` locks the durable ones into the Vitest RLS suite (then `scripts/check-data-model.ts` can go)._

## Commands

- [x] `npm run db:migrate` on your dev branch, then `npm run db:check` → migrations apply, drizzle-kit reports "Everything's fine" → AC-1
- [x] `npm run db:check-model` → every line PASS, exit code 0 (it creates throwaway stores and erases them) → AC-1, AC-2, AC-3, AC-5 to AC-14
- [x] `npm run db:seed` twice → first run places orders 1001 and 1002 for `ada-fabrics` and 1001 for `bola-gadgets`; second run reports `existing: true` for each → AC-9, AC-14
- [x] `NEON_MAIN_ENDPOINT_ID= npx tsx --env-file=.env.local scripts/seed.ts` → refused, exit 1, nothing written → AC-14
- [x] `PGHOST=<main endpoint>-pooler... npx tsx --env-file=.env.local scripts/seed.ts` → refused ("production main branch"), exit 1 → AC-14
- [x] As the owner, query `pg_auth_members` for `rubi_public` → `rubi_app` → `inherit_option = false`, `set_option = true` → AC-2
- [x] As the owner, `select public.uuid_generate_v7()` a few times → version nibble is 7 and values sort by creation time → AC-1

## UI / manual

- [ ] Sign in as `ada@seed.rubi.test` (password `rubi-seed-password`), open `/app` → "Signed in as Ada Okafor"; one store lookup per request → AC-4
- [x] Sign up a new account, open `/app` → redirected to `/app/setup`; create a store there → back on `/app` → AC-4, AC-5
- [x] On `/app/setup`, try the slug `ada-fabrics` with another account → "That store link is taken" → AC-5
- [x] Signed out, open `/app` → redirected to `/sign-in?next=/app` → AC-4
- [x] Open `/s/ada-fabrics` → renders the store; `/s/no-such-store` and an unpublished store's slug → not found page with `noindex` → AC-3, AC-5
- [x] Rename a store's slug (retire the old row, insert the new one, update `stores.slug`), then open `/s/<old slug>` → permanent redirect to `/s/<new slug>` → AC-5

## Value sourcing

- [x] `storeId` comes from `getSellerContext()` → sign in as Bola; every dashboard read shows only Bola's store, never Ada's, even though both are published → AC-2, AC-4
- [x] `owner_user_id` is the session user → after store setup, `stores.owner_user_id` equals the signed in `user.id` (insert with another id fails the policy) → AC-2, AC-5
- [x] Store `id` and slug row come from `uuid_generate_v7()` via `withNewStore`, slug from the form, checked with `slug_available` → `slug_available` is false for a current and a retired slug, true for an unused one → AC-5
- [x] Retired slug → current slug via `store_slugs.store_id` → `stores.slug` → after a rename, a lookup of the old slug returns the new one with `retired = true` → AC-5
- [x] `place_order` `store_id` comes from the slug, never the client → an order on a retired slug lands in the right store; a variant from another store raises `RB002` → AC-7, AC-8
- [x] Tags to invalidate come from `place_order`'s `store_id` and `product_ids` → an order with a tracked stock variant returns that product's id; an untracked only order returns `[]` → AC-7
- [x] Order `number` comes from `stores.next_order_number` under the row lock → 20 parallel orders get consecutive numbers with no gaps; a rejected order never burns a number → AC-10
- [x] `unit_price_kobo`, `product_name`, `image_key` are read inside the function → change the product name and price after an order; the old order line keeps the old values; the image is the lowest `position` image → AC-7
- [x] `variant_label` is null for a default variant → every Slice 1 order line has `variant_label` null → AC-7
- [x] Totals: `line_total = unit × qty`, `subtotal = Σ lines`, `total = subtotal + fee − discount` (fee and discount 0) → an order of 2 × ₦1,500 + 1 × ₦990 has total 399000 kobo; a hand inserted wrong total fails the CHECK → AC-6
- [x] `customer_id` from the upsert on (store, phone) → a second order with the same phone and a different name reuses the customer and keeps its stored name; the order keeps the typed name → AC-7
- [x] Normalised phone via `libphonenumber-js` (region NG) then the SQL regex → `placeOrderSchema` turns `0803 123 4567` into `+2348031234567`; `0803` fails in Zod and raises `RB005` in SQL → AC-8
- [x] `idempotency_key` from the checkout form → the same key twice (second time with another payload, store unpublished) returns the same `order_id` with `existing: true` → AC-9
- [x] `price_changed` detail is the current `price_kobo` per variant → a stale expected price returns `RB003` listing every stale item with its current price → AC-8
- [x] Order event `actor` is `customer` with null `actor_user_id` for `place_order` → the `placed` event row → AC-7
- [x] Displayed money via `formatNaira` → `formatNaira(150000)` renders `₦1,500.00` → AC-6
- [ ] (Later slices) order list keyset pagination, `Africa/Lagos` display time and `payment_status`: no reader exists yet; verify with features 8 and 10

## Acceptance-criteria coverage

- AC-1: migrate + db:check, check-model (tables with RLS), uuid v7 · AC-2: check-model isolation, role membership, Bola sees only Bola · AC-3: check-model public surface, storefront not found · AC-4: dashboard sign in, setup redirect, signed out redirect · AC-5: check-model slugs, setup slug taken, retired slug redirect · AC-6: check-model money, totals row · AC-7: check-model happy path and customer safety, snapshot and actor rows · AC-8: check-model rejections and detail order, phone row · AC-9: check-model idempotency, seed rerun · AC-10: check-model concurrency, number row · AC-11: check-model grants · AC-12: check-model erasure · AC-13: check-model default variant and archive · AC-14: seed guard commands
