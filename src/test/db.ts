// Shared fixtures for the *.db.test.ts suites. They run against the Neon
// branch in .env.local: sellers are inserted as the owner (Better Auth is not
// under test), stores and products go through the app's own paths, and
// deleting the sellers erases everything they made.
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { Client } from "pg";
import { withCheckout, withStore, type Tx } from "@/lib/db";
import { asPgError, type PgError } from "@/lib/db/errors";
import { productImages, products, productVariants, stores } from "@/lib/db/schema";
import { createStore } from "@/features/stores/create-store";

export const STORE_SCOPED = [
  "store_slugs",
  "products",
  "product_variants",
  "product_images",
  "customers",
  "orders",
  "order_items",
  "order_events",
] as const;

export const customer = { name: "Test Customer", phone: "+2348031234567" } as const;
export const delivery = { state: "Lagos", city: "Ikeja", address: "1 Test Street" } as const;

/** A short random tag, so parallel runs and leftovers never collide. */
export const newRun = () => randomUUID().slice(0, 8);

/** Owner connection (bypasses RLS) for setup, inspection and cleanup only. */
export async function connectOwner() {
  const owner = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  await owner.connect();
  return owner;
}

export async function insertSellers(owner: Client, run: string, labels: readonly string[]) {
  const userIds = labels.map((label) => `test-${run}-${label}`);
  for (const userId of userIds) {
    await owner.query(
      `insert into public."user" (id, name, email, updated_at) values ($1, $1, $1 || '@test.rubi.test', now())`,
      [userId],
    );
  }
  return userIds;
}

/** Deletes the sellers (cascading to their stores); returns the store ids they had. */
export async function eraseSellers(owner: Client, userIds: readonly string[]) {
  const { rows } = await owner.query<{ id: string }>(
    "select id from public.stores where owner_user_id = any($1)",
    [userIds],
  );
  await owner.query(`delete from public."user" where id = any($1)`, [userIds]);
  return rows.map((row) => row.id);
}

export async function newStore(userId: string, slug: string) {
  const result = await createStore(userId, { name: `Test ${slug}`, slug });
  if (!result.ok) throw new Error(`createStore ${slug}: ${result.error}`);
  return result.data;
}

export const publish = (storeId: string, at: Date | null = new Date()) =>
  withStore(storeId, (tx) =>
    tx.update(stores).set({ publishedAt: at }).where(eq(stores.id, storeId)),
  );

export async function addProduct(
  tx: Tx,
  storeId: string,
  name: string,
  priceKobo: number,
  stock: number | null,
) {
  const [product] = await tx
    .insert(products)
    .values({ storeId, name, slug: `${name.toLowerCase().replace(/\W+/g, "-")}-${randomUUID()}` })
    .returning({ id: products.id });
  const [variant] = await tx
    .insert(productVariants)
    .values({ storeId, productId: product.id, priceKobo, stock, isDefault: true })
    .returning({ id: productVariants.id });
  await tx.insert(productImages).values({
    storeId,
    productId: product.id,
    r2Key: `test/${product.id}.webp`,
    width: 1,
    height: 1,
  });
  return { productId: product.id, variantId: variant.id };
}

export type Line = { variant_id: string; quantity: number; expected_unit_price_kobo: number };

export const line = (variantId: string, priceKobo: number, quantity = 1): Line => ({
  variant_id: variantId,
  quantity,
  expected_unit_price_kobo: priceKobo,
});

/** Calls place_order directly as rubi_public, skipping the Zod schema. */
export const placeOrderSql = (
  slug: string,
  items: readonly unknown[],
  options: { key?: string; customer?: object; delivery?: object } = {},
) =>
  withCheckout((tx) =>
    tx.execute<{ result: { order_id: string; number: number; existing: boolean } }>(
      sql`select public.place_order(
        ${slug},
        ${options.key ?? randomUUID()}::uuid,
        ${JSON.stringify(options.customer ?? customer)}::jsonb,
        ${JSON.stringify(options.delivery ?? delivery)}::jsonb,
        ${JSON.stringify(items)}::jsonb
      ) as result`,
    ),
  ).then((result) => result.rows[0].result);

/** Runs `fn`, expects it to fail with this SQLSTATE, and returns the error. */
export async function expectPgCode(code: string, fn: () => Promise<unknown>): Promise<PgError> {
  try {
    await fn();
  } catch (error) {
    const pgError = asPgError(error);
    if (pgError?.code !== code) {
      throw new Error(`expected SQLSTATE ${code}, got ${pgError?.code ?? String(error)}`);
    }
    return pgError;
  }
  throw new Error(`expected SQLSTATE ${code}, but it succeeded`);
}
