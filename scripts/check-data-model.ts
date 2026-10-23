// Runs the spec 0002 critical test scenarios against a dev branch, as
// rubi_app and rubi_public, on throwaway stores it creates and then erases.
// Stopgap until /test turns these into the Vitest RLS suite for CI.
//
//   npm run db:check-model
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { and, eq, sql } from "drizzle-orm";
import { Client } from "pg";
import { db, withCheckout, withPublic, withStore, withUser, type Tx } from "@/lib/db";
import { asPgError } from "@/lib/db/errors";
import {
  customers,
  orderEvents,
  orderItems,
  orders,
  productImages,
  products,
  productVariants,
  stores,
  storeSlugs,
} from "@/lib/db/schema";
import { createStore } from "@/features/stores/create-store";

type Check = {
  readonly name: string;
  readonly ac: string;
  readonly passed: boolean;
  readonly detail?: string;
};
const results: Check[] = [];

async function check(ac: string, name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ ac, name, passed: true });
  } catch (error) {
    results.push({ ac, name, passed: false, detail: String(error) });
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Runs `fn` and expects it to fail with this SQLSTATE; returns the error. */
async function expectCode(code: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (error) {
    const pgError = asPgError(error);
    assert(pgError?.code === code, `expected ${code}, got ${pgError?.code ?? String(error)}`);
    return pgError;
  }
  throw new Error(`expected ${code}, but it succeeded`);
}

const STORE_SCOPED = [
  "store_slugs",
  "products",
  "product_variants",
  "product_images",
  "customers",
  "orders",
  "order_items",
  "order_events",
] as const;

const run = randomUUID().slice(0, 8);
const delivery = { state: "Lagos", city: "Ikeja", address: "12 Allen Avenue" };
const customer = { name: "Check Customer", phone: "+2348030000001" };

type Line = { variant_id: string; quantity: number; expected_unit_price_kobo: number };
type Placed = { order_id: string; number: number; total_kobo: number; existing: boolean };

const placeOrder = (
  slug: string,
  items: readonly Line[],
  options: { key?: string; customer?: object; delivery?: object } = {},
) =>
  withCheckout((tx) =>
    tx.execute<{ result: Placed }>(
      sql`select public.place_order(
        ${slug},
        ${options.key ?? randomUUID()}::uuid,
        ${JSON.stringify(options.customer ?? customer)}::jsonb,
        ${JSON.stringify(options.delivery ?? delivery)}::jsonb,
        ${JSON.stringify(items)}::jsonb
      ) as result`,
    ),
  ).then((result) => result.rows[0].result);

async function addProduct(
  tx: Tx,
  storeId: string,
  name: string,
  priceKobo: number,
  stock: number | null,
) {
  const [product] = await tx
    .insert(products)
    .values({ storeId, name, slug: `${name.toLowerCase().replace(/\W+/g, "-")}-${run}` })
    .returning({ id: products.id });
  const [variant] = await tx
    .insert(productVariants)
    .values({ storeId, productId: product.id, priceKobo, stock, isDefault: true })
    .returning({ id: productVariants.id });
  await tx.insert(productImages).values({
    storeId,
    productId: product.id,
    r2Key: `check/${product.id}.webp`,
    width: 1,
    height: 1,
  });
  return { productId: product.id, variantId: variant.id };
}

async function main() {
  const owner = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  await owner.connect();
  const userIds = ["a", "b", "c", "d"].map((label) => `check-${run}-${label}`);
  const countOrders = async (storeId: string) =>
    Number(
      (await owner.query("select count(*) from public.orders where store_id = $1", [storeId]))
        .rows[0].count,
    );

  try {
    // Throwaway sellers, inserted as the owner (Better Auth is not under test).
    for (const userId of userIds) {
      await owner.query(
        `insert into public."user" (id, name, email, updated_at) values ($1, $1, $1 || '@check.rubi.test', now())`,
        [userId],
      );
    }
    const [ua, ub, uc, ud] = userIds;
    const create = async (userId: string, slug: string) => {
      const result = await createStore(userId, { name: `Check ${slug}`, slug });
      assert(result.ok, `createStore ${slug} failed`);
      return result.data;
    };
    const a = await create(ua, `check-a-${run}`);
    const b = await create(ub, `check-b-${run}`);
    const c = await create(uc, `check-c-${run}`); // stays unpublished

    const publish = (storeId: string, at: Date | null) =>
      withStore(storeId, (tx) =>
        tx.update(stores).set({ publishedAt: at }).where(eq(stores.id, storeId)),
      );
    await publish(a.storeId, new Date());
    await publish(b.storeId, new Date());

    const catalogA = await withStore(a.storeId, async (tx) => ({
      wrap: await addProduct(tx, a.storeId, "Wrap", 150_000, null),
      tracked: await addProduct(tx, a.storeId, "Tracked", 99_000, 5),
      last: await addProduct(tx, a.storeId, "Last unit", 50_000, 1),
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
    const catalogB = await withStore(b.storeId, async (tx) => ({
      gadget: await addProduct(tx, b.storeId, "Gadget", 200_000, null),
    }));
    const catalogC = await withStore(c.storeId, async (tx) => ({
      hidden: await addProduct(tx, c.storeId, "Hidden", 1_000, null),
    }));

    const line = (variantId: string, priceKobo: number, quantity = 1): Line => ({
      variant_id: variantId,
      quantity,
      expected_unit_price_kobo: priceKobo,
    });

    // Happy path, AC-1 AC-7 AC-13
    let firstOrderId = "";
    await check("AC-7", "place_order writes order, snapshot lines, event, stock", async () => {
      const placed = await placeOrder(a.slug, [
        line(catalogA.wrap.variantId, 150_000, 2),
        line(catalogA.tracked.variantId, 99_000, 1),
      ]);
      firstOrderId = placed.order_id;
      assert(placed.number === 1001, `number ${placed.number}`);
      assert(placed.total_kobo === 399_000, `total ${placed.total_kobo}`);
      await withStore(a.storeId, async (tx) => {
        const [order] = await tx.select().from(orders).where(eq(orders.id, placed.order_id));
        assert(order.subtotalKobo === 399_000 && order.totalKobo === 399_000, "order totals");
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        assert(items.length === 2, "two lines");
        const wrap = items.find((item) => item.variantId === catalogA.wrap.variantId)!;
        assert(
          wrap.productName === "Wrap" && wrap.unitPriceKobo === 150_000,
          "snapshot name and price",
        );
        assert(
          wrap.lineTotalKobo === 300_000 && wrap.imageKey?.startsWith("check/"),
          "line total, image",
        );
        const events = await tx.select().from(orderEvents).where(eq(orderEvents.orderId, order.id));
        assert(
          events.length === 1 && events[0].type === "placed" && events[0].actor === "customer",
          "event",
        );
        const [variant] = await tx
          .select({ stock: productVariants.stock })
          .from(productVariants)
          .where(eq(productVariants.id, catalogA.tracked.variantId));
        assert(variant.stock === 4, `stock ${variant.stock}`);
      });
    });

    await check("AC-1", "every Slice 1 table exists with RLS on", async () => {
      const { rows } = await owner.query(
        `select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename = any($1)`,
        [["stores", ...STORE_SCOPED]],
      );
      assert(rows.length === 9 && rows.every((row) => row.rowsecurity), JSON.stringify(rows));
    });

    // Isolation, AC-2
    await check("AC-2", "withStore(A) sees only store A rows in every table", async () => {
      await withStore(a.storeId, async (tx) => {
        for (const table of STORE_SCOPED) {
          const { rows } = await tx.execute<{ foreign: string; own: string }>(
            sql`select count(*) filter (where store_id <> ${a.storeId}) as foreign,
                       count(*) filter (where store_id = ${a.storeId}) as own
                from ${sql.identifier(table)}`,
          );
          assert(Number(rows[0].foreign) === 0, `${table} leaks ${rows[0].foreign} rows`);
          assert(Number(rows[0].own) > 0, `${table} shows none of A's rows`);
        }
        const visible = await tx.select({ id: stores.id }).from(stores);
        assert(visible.length === 1 && visible[0].id === a.storeId, "stores shows only A");
        // B is published, yet rubi_public policies never apply to rubi_app.
        const bProducts = await tx.select().from(products).where(eq(products.storeId, b.storeId));
        assert(bProducts.length === 0, "published B products visible");
      });
    });
    await check("AC-2", "inserting a row for store B inside withStore(A) fails", async () => {
      await expectCode("42501", () =>
        withStore(a.storeId, (tx) =>
          tx.insert(products).values({ storeId: b.storeId, name: "Sneaky", slug: `sneaky-${run}` }),
        ),
      );
    });
    await check("AC-2", "with no app.store_id, store scoped tables return zero rows", async () => {
      await db.transaction(async (tx) => {
        for (const table of ["stores", ...STORE_SCOPED]) {
          const { rows } = await tx.execute<{ n: string }>(
            sql`select count(*) as n from ${sql.identifier(table)}`,
          );
          assert(Number(rows[0].n) === 0, `${table} shows ${rows[0].n} rows`);
        }
      });
    });

    // Public surface, AC-3
    await check("AC-3", "rubi_public sees published catalog only", async () => {
      await withPublic(async (tx) => {
        const storeIds = (await tx.select({ id: stores.id }).from(stores)).map((row) => row.id);
        assert(
          storeIds.includes(a.storeId) && !storeIds.includes(c.storeId),
          "unpublished store visible",
        );
        const slugRows = await tx
          .select({ slug: storeSlugs.slug })
          .from(storeSlugs)
          .where(eq(storeSlugs.storeId, c.storeId));
        assert(slugRows.length === 0, "unpublished slug visible");
        const hidden = await tx
          .select({ id: products.id })
          .from(products)
          .where(eq(products.id, catalogC.hidden.productId));
        assert(hidden.length === 0, "unpublished store product visible");
        const archived = await tx
          .select({ id: products.id })
          .from(products)
          .where(eq(products.id, catalogA.archived.productId));
        assert(archived.length === 0, "archived product visible");
        const archivedVariants = await tx
          .select({ id: productVariants.id })
          .from(productVariants)
          .where(
            sql`${productVariants.id} in (${catalogA.archived.variantId}, ${catalogA.archivedVariant.variantId})`,
          );
        assert(archivedVariants.length === 0, "archived variants visible");
        const archivedImages = await tx
          .select({ id: productImages.id })
          .from(productImages)
          .where(eq(productImages.productId, catalogA.archived.productId));
        assert(archivedImages.length === 0, "archived product images visible");
        const live = await tx
          .select({ id: productVariants.id, stock: productVariants.stock })
          .from(productVariants)
          .where(eq(productVariants.id, catalogA.tracked.variantId));
        assert(live.length === 1, "published variant hidden");
      });
    });
    for (const [label, query] of [
      ["owner_user_id", sql`select owner_user_id from public.stores`],
      ["next_order_number", sql`select next_order_number from public.stores`],
      ["customers", sql`select id from public.customers`],
      ["orders", sql`select id from public.orders`],
      ["order_items", sql`select id from public.order_items`],
      ["order_events", sql`select id from public.order_events`],
    ] as const) {
      await check("AC-3", `rubi_public cannot read ${label}`, async () => {
        await expectCode("42501", () => withPublic((tx) => tx.execute(query)));
      });
    }
    for (const [label, query] of [
      [
        "insert products",
        sql`insert into public.products (store_id, name, slug) values (${a.storeId}, 'x', ${`x-${run}`})`,
      ],
      ["update variants", sql`update public.product_variants set stock = 0`],
      ["delete images", sql`delete from public.product_images`],
      [
        "insert order_events",
        sql`insert into public.order_events (store_id, order_id, type, actor) values (${a.storeId}, ${randomUUID()}, 'note', 'system')`,
      ],
    ] as const) {
      await check("AC-3", `rubi_public cannot ${label} (even read write)`, async () => {
        await expectCode("42501", () => withCheckout((tx) => tx.execute(query)));
      });
    }

    // Slugs and one store per user, AC-5
    await check("AC-5", "a second createStore returns the first store", async () => {
      const again = await createStore(ua, { name: "Another", slug: `check-a2-${run}` });
      assert(
        again.ok && again.data.storeId === a.storeId && again.data.slug === a.slug,
        "different store",
      );
    });
    const renamed = `check-a-new-${run}`;
    await check(
      "AC-5",
      "retired slug is held, resolves to the current one, can be taken back",
      async () => {
        // Rename A: retire the current slug, add the new one.
        await withStore(a.storeId, async (tx) => {
          await tx
            .update(storeSlugs)
            .set({ retiredAt: new Date() })
            .where(and(eq(storeSlugs.slug, a.slug), sql`${storeSlugs.retiredAt} is null`));
          await tx.insert(storeSlugs).values({ slug: renamed, storeId: a.storeId });
          await tx.update(stores).set({ slug: renamed }).where(eq(stores.id, a.storeId));
        });
        const available = await withUser(ud, (tx) =>
          tx.execute<{ available: boolean }>(
            sql`select public.slug_available(${a.slug}) as available`,
          ),
        );
        assert(available.rows[0].available === false, "retired slug reported available");
        const fresh = await withUser(ud, (tx) =>
          tx.execute<{ available: boolean }>(
            sql`select public.slug_available(${`free-${run}`}) as available`,
          ),
        );
        assert(fresh.rows[0].available === true, "unused slug reported taken");
        const taken = await createStore(ud, { name: "Squatter", slug: a.slug });
        assert(!taken.ok && taken.error === "slug_taken", `squatter got ${JSON.stringify(taken)}`);

        const resolved = await withPublic((tx) =>
          tx
            .select({ current: stores.slug, retiredAt: storeSlugs.retiredAt })
            .from(storeSlugs)
            .innerJoin(stores, eq(stores.id, storeSlugs.storeId))
            .where(eq(storeSlugs.slug, a.slug)),
        );
        assert(
          resolved[0]?.current === renamed && resolved[0].retiredAt !== null,
          "retired slug lookup",
        );

        // Take the old slug back.
        await withStore(a.storeId, async (tx) => {
          await tx
            .update(storeSlugs)
            .set({ retiredAt: new Date() })
            .where(eq(storeSlugs.slug, renamed));
          await tx.update(storeSlugs).set({ retiredAt: null }).where(eq(storeSlugs.slug, a.slug));
          await tx.update(stores).set({ slug: a.slug }).where(eq(stores.id, a.storeId));
        });
      },
    );

    // Money, AC-6
    await check(
      "AC-6",
      "the database rejects totals that do not add up and negative amounts",
      async () => {
        await withStore(a.storeId, async (tx) => {
          const [order] = await tx.select().from(orders).where(eq(orders.id, firstOrderId));
          const base = {
            storeId: a.storeId,
            customerId: order.customerId,
            customerName: "x",
            deliveryState: "Lagos" as const,
            deliveryCity: "x",
            deliveryAddress: "x",
          };
          await expectCode("23514", () =>
            tx.transaction((sp) =>
              sp.insert(orders).values({
                ...base,
                number: 9001,
                idempotencyKey: randomUUID(),
                subtotalKobo: 100,
                totalKobo: 90,
              }),
            ),
          );
          await expectCode("23514", () =>
            tx.transaction((sp) =>
              sp.insert(orders).values({
                ...base,
                number: 9002,
                idempotencyKey: randomUUID(),
                subtotalKobo: 100,
                discountKobo: -10,
                totalKobo: 110,
              }),
            ),
          );
          await expectCode("23514", () =>
            tx.transaction((sp) =>
              sp.insert(orderItems).values({
                storeId: a.storeId,
                orderId: firstOrderId,
                productName: "x",
                unitPriceKobo: 100,
                quantity: 2,
                lineTotalKobo: 150,
              }),
            ),
          );
        });
      },
    );

    // Rejections, AC-8
    const rejections: readonly [string, string, () => Promise<unknown>][] = [
      [
        "unpublished store",
        "RB001",
        () => placeOrder(c.slug, [line(catalogC.hidden.variantId, 1_000)]),
      ],
      [
        "unknown slug",
        "RB001",
        () => placeOrder(`nope-${run}`, [line(catalogA.wrap.variantId, 150_000)]),
      ],
      [
        "foreign variant",
        "RB002",
        () => placeOrder(a.slug, [line(catalogB.gadget.variantId, 200_000)]),
      ],
      [
        "archived variant",
        "RB002",
        () => placeOrder(a.slug, [line(catalogA.archivedVariant.variantId, 10_000)]),
      ],
      [
        "archived product",
        "RB002",
        () => placeOrder(a.slug, [line(catalogA.archived.variantId, 10_000)]),
      ],
      [
        "duplicate line",
        "RB005",
        () =>
          placeOrder(a.slug, [
            line(catalogA.wrap.variantId, 150_000),
            line(catalogA.wrap.variantId, 150_000),
          ]),
      ],
      [
        "short stock",
        "RB004",
        () => placeOrder(a.slug, [line(catalogA.tracked.variantId, 99_000, 50)]),
      ],
      [
        "stale expected price",
        "RB003",
        () => placeOrder(a.slug, [line(catalogA.wrap.variantId, 140_000)]),
      ],
      [
        "51 lines",
        "RB005",
        () =>
          placeOrder(
            a.slug,
            Array.from({ length: 51 }, () => line(randomUUID(), 1)),
          ),
      ],
      [
        "301 character address",
        "RB005",
        () =>
          placeOrder(a.slug, [line(catalogA.wrap.variantId, 150_000)], {
            delivery: { ...delivery, address: "x".repeat(301) },
          }),
      ],
      [
        "invalid phone",
        "RB005",
        () =>
          placeOrder(a.slug, [line(catalogA.wrap.variantId, 150_000)], {
            customer: { name: "x", phone: "0803" },
          }),
      ],
      [
        "unknown state",
        "RB005",
        () =>
          placeOrder(a.slug, [line(catalogA.wrap.variantId, 150_000)], {
            delivery: { ...delivery, state: "Lagos State" },
          }),
      ],
    ];
    for (const [label, code, attempt] of rejections) {
      await check("AC-8", `${label} raises ${code} and writes nothing`, async () => {
        const before = await countOrders(a.storeId);
        await expectCode(code, attempt);
        assert((await countOrders(a.storeId)) === before, "orders written");
      });
    }
    await check("AC-8", "errors list every failing item, checks run in a fixed order", async () => {
      const price = await expectCode("RB003", () =>
        placeOrder(a.slug, [line(catalogA.wrap.variantId, 1), line(catalogA.tracked.variantId, 2)]),
      );
      const detail = JSON.parse(price.detail ?? "[]");
      assert(
        detail.length === 2 && detail[0].current_price_kobo === 150_000,
        `detail ${price.detail}`,
      );
      // A foreign variant with a stale price is reported as unavailable only.
      const order = await expectCode("RB002", () =>
        placeOrder(a.slug, [line(catalogB.gadget.variantId, 1), line(catalogA.wrap.variantId, 1)]),
      );
      assert(JSON.parse(order.detail ?? "[]").length === 1, `detail ${order.detail}`);
      const fields = await expectCode("RB005", () =>
        placeOrder(a.slug, [line(catalogA.wrap.variantId, 150_000)], {
          customer: { name: "", phone: "x" },
          delivery: { ...delivery, city: "" },
        }),
      );
      assert(JSON.parse(fields.detail ?? "[]").length === 3, `detail ${fields.detail}`);
    });

    // Idempotency, AC-9
    await check(
      "AC-9",
      "same key returns the original order, even after unpublishing",
      async () => {
        const key = randomUUID();
        const first = await placeOrder(a.slug, [line(catalogA.wrap.variantId, 150_000)], { key });
        const [{ next }] = (
          await owner.query("select next_order_number as next from public.stores where id = $1", [
            a.storeId,
          ])
        ).rows;
        await publish(a.storeId, null);
        const again = await placeOrder(a.slug, [line(catalogA.tracked.variantId, 99_000, 3)], {
          key,
        });
        await publish(a.storeId, new Date());
        assert(again.order_id === first.order_id && again.existing === true, "different order");
        const [{ next: after }] = (
          await owner.query("select next_order_number as next from public.stores where id = $1", [
            a.storeId,
          ])
        ).rows;
        assert(after === next, "counter bumped");
      },
    );

    // Customer safety, AC-7
    await check(
      "AC-7",
      "a known phone with a new name keeps the stored customer name",
      async () => {
        const placed = await placeOrder(a.slug, [line(catalogA.wrap.variantId, 150_000)], {
          customer: { ...customer, name: "Someone Else", email: "else@example.com" },
        });
        await withStore(a.storeId, async (tx) => {
          const [order] = await tx.select().from(orders).where(eq(orders.id, placed.order_id));
          const [stored] = await tx
            .select()
            .from(customers)
            .where(eq(customers.id, order.customerId));
          assert(stored.name === customer.name, `name overwritten to ${stored.name}`);
          assert(stored.email === "else@example.com", "missing email not filled");
          assert(order.customerName === "Someone Else", "order lost what the guest typed");
        });
      },
    );

    // Concurrency, AC-10
    await check("AC-10", "20 parallel orders get gap free consecutive numbers", async () => {
      const [{ next }] = (
        await owner.query("select next_order_number as next from public.stores where id = $1", [
          a.storeId,
        ])
      ).rows;
      const placed = await Promise.all(
        Array.from({ length: 20 }, () =>
          placeOrder(a.slug, [line(catalogA.wrap.variantId, 150_000)]),
        ),
      );
      const numbers = placed.map((p) => p.number).sort((x, y) => x - y);
      const expected = Array.from({ length: 20 }, (_, i) => next + i);
      assert(JSON.stringify(numbers) === JSON.stringify(expected), `numbers ${numbers}`);
    });
    await check(
      "AC-10",
      "two parallel orders for the last unit: exactly one succeeds",
      async () => {
        const outcomes = await Promise.allSettled([
          placeOrder(a.slug, [line(catalogA.last.variantId, 50_000)]),
          placeOrder(a.slug, [line(catalogA.last.variantId, 50_000)]),
        ]);
        const ok = outcomes.filter((o) => o.status === "fulfilled").length;
        const failed = outcomes.filter(
          (o) => o.status === "rejected" && asPgError(o.reason)?.code === "RB004",
        );
        assert(ok === 1 && failed.length === 1, JSON.stringify(outcomes.map((o) => o.status)));
      },
    );

    // Grants, AC-11
    for (const [label, query] of [
      ["delete orders", sql`delete from public.orders`],
      ["delete store_slugs", sql`delete from public.store_slugs`],
      ["delete stores", sql`delete from public.stores`],
      ["delete customers", sql`delete from public.customers`],
      ["delete order_events", sql`delete from public.order_events`],
      ["delete products", sql`delete from public.products`],
      ["delete product_variants", sql`delete from public.product_variants`],
      ["update order_events", sql`update public.order_events set note = 'x'`],
      ["update store_slugs.slug", sql`update public.store_slugs set slug = slug`],
      ["update stores.owner_user_id", sql`update public.stores set owner_user_id = ${ub}`],
      ["update stores.id", sql`update public.stores set id = id`],
      ["update stores.next_order_number", sql`update public.stores set next_order_number = 1`],
      [
        "call place_order directly",
        sql`select public.place_order('x', ${randomUUID()}::uuid, '{}', '{}', '[]')`,
      ],
    ] as const) {
      await check("AC-11", `rubi_app cannot ${label}`, async () => {
        await expectCode("42501", () => withStore(a.storeId, (tx) => tx.execute(query)));
      });
    }

    // Default variant, AC-13
    await check("AC-13", "a product has at most one default variant", async () => {
      await expectCode("23505", () =>
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
    await check("AC-13", "archived product lines still reference it", async () => {
      await withStore(a.storeId, (tx) =>
        tx
          .update(products)
          .set({ archivedAt: new Date() })
          .where(eq(products.id, catalogA.tracked.productId)),
      );
      const lines = await withStore(a.storeId, (tx) =>
        tx.select().from(orderItems).where(eq(orderItems.productId, catalogA.tracked.productId)),
      );
      assert(lines.length > 0, "order lines lost the product");
      const visible = await withPublic((tx) =>
        tx
          .select({ id: products.id })
          .from(products)
          .where(eq(products.id, catalogA.tracked.productId)),
      );
      assert(visible.length === 0, "archived product still public");
    });

    // Seed guard, AC-14
    await check("AC-14", "seed refuses without NEON_MAIN_ENDPOINT_ID or against main", async () => {
      const seed = (env: Record<string, string>) =>
        spawnSync("npx", ["tsx", "scripts/seed.ts"], {
          env: { ...process.env, ...env },
          encoding: "utf8",
        });
      const unset = seed({ NEON_MAIN_ENDPOINT_ID: "" });
      assert(unset.status !== 0 && unset.stdout.length === 0, "ran with the guard unset");
      const main = seed({
        NEON_MAIN_ENDPOINT_ID: "ep-check-main",
        PGHOST: "ep-check-main-pooler.example",
      });
      assert(main.status !== 0 && /production main/.test(main.stderr), "ran against main");
      const production = seed({ VERCEL_ENV: "production" });
      assert(production.status !== 0, "ran in production");
    });
  } finally {
    // Erasure, AC-12: deleting the users removes every row of their stores.
    const { rows } = await owner.query<{ id: string }>(
      "select id from public.stores where owner_user_id = any($1)",
      [userIds],
    );
    await owner.query(`delete from public."user" where id = any($1)`, [userIds]);
    await check("AC-12", "deleting a user deletes their store and every row in it", async () => {
      for (const table of ["stores", ...STORE_SCOPED]) {
        const column = table === "stores" ? "id" : "store_id";
        const { rows: left } = await owner.query(
          `select count(*) from public.${table} where ${column} = any($1)`,
          [rows.map((row) => row.id)],
        );
        assert(Number(left[0].count) === 0, `${table} kept ${left[0].count} rows`);
      }
    });
    await owner.end();
    await db.$client.end();
  }

  for (const result of results) {
    console.log(
      `${result.passed ? "PASS" : "FAIL"}  ${result.ac.padEnd(5)}  ${result.name}${result.detail ? `\n        ${result.detail}` : ""}`,
    );
  }
  const failed = results.filter((result) => !result.passed).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
