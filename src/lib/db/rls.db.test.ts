// Spec 0002 tenant isolation, public surface, grants and erasure, as
// rubi_app (withStore) and rubi_public (withPublic, withCheckout).
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, withCheckout, withPublic, withStore } from "@/lib/db";
import {
  orderItems,
  orders,
  productImages,
  products,
  productVariants,
  stores,
  storeSlugs,
} from "@/lib/db/schema";
import {
  STORE_SCOPED,
  addProduct,
  connectOwner,
  eraseSellers,
  expectPgCode,
  insertSellers,
  line,
  newRun,
  newStore,
  placeOrderSql,
  publish,
} from "@/test/db";

const run = newRun();
let owner: Client;
let userIds: string[];
let a: { storeId: string; slug: string };
let b: { storeId: string; slug: string };
let c: { storeId: string; slug: string };
let catalogA: Record<
  "wrap" | "tracked" | "archived" | "archivedVariant",
  { productId: string; variantId: string }
>;
let catalogB: { gadget: { productId: string; variantId: string } };
let catalogC: { hidden: { productId: string; variantId: string } };
let orderId: string;
let erased = false;

beforeAll(async () => {
  owner = await connectOwner();
  userIds = await insertSellers(owner, run, ["a", "b", "c"]);
  a = await newStore(userIds[0], `rls-a-${run}`);
  b = await newStore(userIds[1], `rls-b-${run}`);
  c = await newStore(userIds[2], `rls-c-${run}`); // stays unpublished
  await publish(a.storeId);
  await publish(b.storeId);

  catalogA = await withStore(a.storeId, async (tx) => ({
    wrap: await addProduct(tx, a.storeId, "Wrap", 150_000, null),
    tracked: await addProduct(tx, a.storeId, "Tracked", 99_000, 5),
    archived: await addProduct(tx, a.storeId, "Archived", 10_000, null),
    archivedVariant: await addProduct(tx, a.storeId, "Archived variant", 10_000, null),
  }));
  await withStore(a.storeId, async (tx) => {
    await tx
      .update(products)
      .set({ archivedAt: new Date() })
      .where(eq(products.id, catalogA.archived.productId));
    await tx
      .update(productVariants)
      .set({ archivedAt: new Date() })
      .where(eq(productVariants.id, catalogA.archivedVariant.variantId));
  });
  catalogB = await withStore(b.storeId, async (tx) => ({
    gadget: await addProduct(tx, b.storeId, "Gadget", 200_000, null),
  }));
  catalogC = await withStore(c.storeId, async (tx) => ({
    hidden: await addProduct(tx, c.storeId, "Hidden", 1_000, null),
  }));

  // One order in each published store, so every store scoped table has rows.
  orderId = (
    await placeOrderSql(a.slug, [
      line(catalogA.wrap.variantId, 150_000),
      line(catalogA.tracked.variantId, 99_000),
    ])
  ).order_id;
  await placeOrderSql(b.slug, [line(catalogB.gadget.variantId, 200_000)]);
});

afterAll(async () => {
  if (!erased) await eraseSellers(owner, userIds);
  await owner.end();
  await db.$client.end();
});

describe("schema", () => {
  // covers: AC-1
  it("has every Slice 1 table with row level security on", async () => {
    const { rows } = await owner.query(
      `select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename = any($1)`,
      [["stores", ...STORE_SCOPED]],
    );
    expect(rows).toHaveLength(9);
    expect(rows.filter((row) => !row.rowsecurity)).toEqual([]);
  });

  // covers: AC-1
  it("generates version 7 UUIDs that sort by creation time", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const { rows } = await owner.query("select public.uuid_generate_v7()::text as id");
      ids.push(rows[0].id);
    }
    expect(ids.map((id) => id[14])).toEqual(Array(5).fill("7"));
    expect([...ids].sort()).toEqual(ids);
  });

  // covers: AC-2
  it("lets rubi_app switch to rubi_public without inheriting its rights", async () => {
    const { rows } = await owner.query(
      `select m.inherit_option, m.set_option
       from pg_auth_members m
       join pg_roles r on r.oid = m.roleid
       join pg_roles u on u.oid = m.member
       where r.rolname = 'rubi_public' and u.rolname = 'rubi_app'`,
    );
    expect(rows).toEqual([{ inherit_option: false, set_option: true }]);
  });
});

describe("store isolation as rubi_app", () => {
  // covers: AC-2
  it.each(STORE_SCOPED)("withStore(A) sees only store A rows in %s", async (table) => {
    const { rows } = await withStore(a.storeId, (tx) =>
      tx.execute<{ foreign: string; own: string }>(
        sql`select count(*) filter (where store_id <> ${a.storeId}) as foreign,
                   count(*) filter (where store_id = ${a.storeId}) as own
            from ${sql.identifier(table)}`,
      ),
    );
    expect(Number(rows[0].foreign)).toBe(0);
    expect(Number(rows[0].own)).toBeGreaterThan(0);
  });

  // covers: AC-2
  it("withStore(A) sees only store A in stores", async () => {
    const visible = await withStore(a.storeId, (tx) => tx.select({ id: stores.id }).from(stores));
    expect(visible).toEqual([{ id: a.storeId }]);
  });

  // covers: AC-2
  it("withStore(A) never sees published store B products", async () => {
    const rows = await withStore(a.storeId, (tx) =>
      tx.select().from(products).where(eq(products.storeId, b.storeId)),
    );
    expect(rows).toEqual([]);
  });

  // covers: AC-2
  it("refuses to insert a row for store B inside withStore(A)", async () => {
    await expectPgCode("42501", () =>
      withStore(a.storeId, (tx) =>
        tx.insert(products).values({ storeId: b.storeId, name: "Sneaky", slug: `sneaky-${run}` }),
      ),
    );
  });

  // covers: AC-2
  it("cannot move a store A row into store B", async () => {
    await expectPgCode("42501", () =>
      withStore(a.storeId, (tx) =>
        tx
          .update(products)
          .set({ storeId: b.storeId })
          .where(eq(products.id, catalogA.wrap.productId)),
      ),
    );
  });

  // covers: AC-2
  it.each(["stores", ...STORE_SCOPED])(
    "returns zero rows from %s when no store is set",
    async (table) => {
      const { rows } = await db.transaction((tx) =>
        tx.execute<{ n: string }>(sql`select count(*) as n from ${sql.identifier(table)}`),
      );
      expect(Number(rows[0].n)).toBe(0);
    },
  );
});

describe("public surface as rubi_public", () => {
  // covers: AC-3
  it("lists published stores and hides unpublished ones", async () => {
    const ids = await withPublic((tx) => tx.select({ id: stores.id }).from(stores));
    const visible = ids.map((row) => row.id);
    expect(visible).toContain(a.storeId);
    expect(visible).not.toContain(c.storeId);
  });

  // covers: AC-3
  it("hides an unpublished store's slugs and products", async () => {
    const [slugs, hidden] = await withPublic(async (tx) => [
      await tx
        .select({ slug: storeSlugs.slug })
        .from(storeSlugs)
        .where(eq(storeSlugs.storeId, c.storeId)),
      await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, catalogC.hidden.productId)),
    ]);
    expect(slugs).toEqual([]);
    expect(hidden).toEqual([]);
  });

  // covers: AC-3, AC-13
  it("hides archived products, their variants and images", async () => {
    const [product, variants, images] = await withPublic(async (tx) => [
      await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, catalogA.archived.productId)),
      await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(
          inArray(productVariants.id, [
            catalogA.archived.variantId,
            catalogA.archivedVariant.variantId,
          ]),
        ),
      await tx
        .select({ id: productImages.id })
        .from(productImages)
        .where(eq(productImages.productId, catalogA.archived.productId)),
    ]);
    expect(product).toEqual([]);
    expect(variants).toEqual([]);
    expect(images).toEqual([]);
  });

  // covers: AC-3
  it("shows a live variant of a published store, with its stock", async () => {
    const rows = await withPublic((tx) =>
      tx
        .select({ id: productVariants.id, stock: productVariants.stock })
        .from(productVariants)
        .where(eq(productVariants.id, catalogA.tracked.variantId)),
    );
    expect(rows).toEqual([{ id: catalogA.tracked.variantId, stock: 4 }]);
  });

  // covers: AC-3
  it.each([
    ["stores.owner_user_id", sql`select owner_user_id from public.stores`],
    ["stores.next_order_number", sql`select next_order_number from public.stores`],
    ["customers", sql`select id from public.customers`],
    ["orders", sql`select id from public.orders`],
    ["order_items", sql`select id from public.order_items`],
    ["order_events", sql`select id from public.order_events`],
  ])("cannot read %s", async (_, query) => {
    await expectPgCode("42501", () => withPublic((tx) => tx.execute(query)));
  });

  // covers: AC-3
  it.each([
    [
      "insert products",
      () =>
        sql`insert into public.products (store_id, name, slug) values (${a.storeId}, 'x', ${`x-${run}`})`,
    ],
    ["update product_variants", () => sql`update public.product_variants set stock = 0`],
    ["delete product_images", () => sql`delete from public.product_images`],
    [
      "insert order_events",
      () =>
        sql`insert into public.order_events (store_id, order_id, type, actor) values (${a.storeId}, ${randomUUID()}, 'note', 'system')`,
    ],
  ])("cannot %s, even in a read write transaction", async (_, query) => {
    await expectPgCode("42501", () => withCheckout((tx) => tx.execute(query())));
  });
});

describe("money checks", () => {
  const insertOrder = (values: {
    number: number;
    subtotalKobo: number;
    totalKobo: number;
    discountKobo?: number;
  }) =>
    withStore(a.storeId, async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
      return tx.insert(orders).values({
        storeId: a.storeId,
        customerId: order.customerId,
        customerName: "x",
        deliveryState: "Lagos",
        deliveryCity: "x",
        deliveryAddress: "x",
        idempotencyKey: randomUUID(),
        ...values,
      });
    });

  // covers: AC-6
  it("rejects an order whose total is not subtotal plus fee minus discount", async () => {
    await expectPgCode("23514", () =>
      insertOrder({ number: 9001, subtotalKobo: 100, totalKobo: 90 }),
    );
  });

  // covers: AC-6
  it("rejects a negative discount", async () => {
    await expectPgCode("23514", () =>
      insertOrder({ number: 9002, subtotalKobo: 100, discountKobo: -10, totalKobo: 110 }),
    );
  });

  // covers: AC-6
  it("rejects an order line whose total is not unit price times quantity", async () => {
    await expectPgCode("23514", () =>
      withStore(a.storeId, (tx) =>
        tx.insert(orderItems).values({
          storeId: a.storeId,
          orderId,
          productName: "x",
          unitPriceKobo: 100,
          quantity: 2,
          lineTotalKobo: 150,
        }),
      ),
    );
  });
});

describe("rubi_app grants", () => {
  // covers: AC-11
  it.each([
    ["delete orders", () => sql`delete from public.orders`],
    ["delete store_slugs", () => sql`delete from public.store_slugs`],
    ["delete stores", () => sql`delete from public.stores`],
    ["delete customers", () => sql`delete from public.customers`],
    ["delete order_events", () => sql`delete from public.order_events`],
    ["delete products", () => sql`delete from public.products`],
    ["delete product_variants", () => sql`delete from public.product_variants`],
    ["update order_events", () => sql`update public.order_events set note = 'x'`],
    ["update store_slugs.slug", () => sql`update public.store_slugs set slug = slug`],
    [
      "update stores.owner_user_id",
      () => sql`update public.stores set owner_user_id = ${userIds[1]}`,
    ],
    ["update stores.id", () => sql`update public.stores set id = id`],
    ["update stores.next_order_number", () => sql`update public.stores set next_order_number = 1`],
    [
      "call place_order directly",
      () => sql`select public.place_order('x', ${randomUUID()}::uuid, '{}', '{}', '[]')`,
    ],
  ])("cannot %s", async (_, query) => {
    await expectPgCode("42501", () => withStore(a.storeId, (tx) => tx.execute(query())));
  });
});

describe("variants and archiving", () => {
  // covers: AC-13
  it("allows at most one default variant per product", async () => {
    await expectPgCode("23505", () =>
      withStore(a.storeId, (tx) =>
        tx.insert(productVariants).values({
          storeId: a.storeId,
          productId: catalogA.wrap.productId,
          priceKobo: 1,
          isDefault: true,
        }),
      ),
    );
  });

  // covers: AC-13
  it("keeps order lines pointing at a product after it is archived", async () => {
    await withStore(a.storeId, (tx) =>
      tx
        .update(products)
        .set({ archivedAt: new Date() })
        .where(eq(products.id, catalogA.tracked.productId)),
    );
    const lines = await withStore(a.storeId, (tx) =>
      tx.select().from(orderItems).where(eq(orderItems.productId, catalogA.tracked.productId)),
    );
    const visible = await withPublic((tx) =>
      tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, catalogA.tracked.productId)),
    );
    expect(lines).toHaveLength(1);
    expect(visible).toEqual([]);
  });
});

// Runs last: it erases the fixtures.
describe("erasure", () => {
  // covers: AC-12
  it("deleting the sellers deletes their stores and every row in them", async () => {
    const storeIds = await eraseSellers(owner, userIds);
    erased = true;
    expect(storeIds).toHaveLength(3);
    for (const table of ["stores", ...STORE_SCOPED]) {
      const column = table === "stores" ? "id" : "store_id";
      const { rows } = await owner.query(
        `select count(*)::int as n from public.${table} where ${column} = any($1)`,
        [storeIds],
      );
      expect({ table, left: rows[0].n }).toEqual({ table, left: 0 });
    }
  });
});
