// placeOrder (Zod, then the place_order SQL function as rubi_public) against
// a real branch. The SQL function is also called directly to prove it
// checks its own input when the Zod schema is skipped.
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db, withStore } from "@/lib/db";
import {
  customers,
  orderEvents,
  orderItems,
  orders,
  productImages,
  products,
  productVariants,
} from "@/lib/db/schema";
import {
  addProduct,
  connectOwner,
  customer,
  delivery,
  eraseSellers,
  expectPgCode,
  insertSellers,
  line,
  newRun,
  newStore,
  placeOrderSql,
  publish,
} from "@/test/db";
import { placeOrder } from "./place-order";

const updateTag = vi.fn();
vi.mock("next/cache", () => ({ updateTag: (tag: string) => updateTag(tag) }));

type Item = { productId: string; variantId: string };

const run = newRun();
let owner: Client;
let userIds: string[];
let a: { storeId: string; slug: string };
let b: { storeId: string; slug: string };
let c: { storeId: string; slug: string };
let catalogA: Record<
  "wrap" | "tracked" | "last" | "snapshot" | "archived" | "archivedVariant",
  Item
>;
let gadgetB: Item;
let hiddenC: Item;

const item = (variantId: string, expectedUnitPriceKobo: number, quantity = 1) => ({
  variantId,
  quantity,
  expectedUnitPriceKobo,
});

const order = (
  slug: string,
  items: ReturnType<typeof item>[],
  overrides: { idempotencyKey?: string; customer?: object } = {},
) => ({
  storeSlug: slug,
  idempotencyKey: overrides.idempotencyKey ?? randomUUID(),
  customer: { ...customer, ...overrides.customer },
  delivery,
  items,
});

const counts = async (storeId: string) => {
  const { rows } = await owner.query(
    `select (select count(*)::int from public.orders where store_id = $1) as orders,
            next_order_number as next
     from public.stores where id = $1`,
    [storeId],
  );
  return rows[0] as { orders: number; next: number };
};

beforeAll(async () => {
  owner = await connectOwner();
  userIds = await insertSellers(owner, run, ["a", "b", "c"]);
  a = await newStore(userIds[0], `order-a-${run}`);
  b = await newStore(userIds[1], `order-b-${run}`);
  c = await newStore(userIds[2], `order-c-${run}`); // stays unpublished
  await publish(a.storeId);
  await publish(b.storeId);

  catalogA = await withStore(a.storeId, async (tx) => ({
    wrap: await addProduct(tx, a.storeId, "Wrap", 150_000, null),
    tracked: await addProduct(tx, a.storeId, "Tracked", 99_000, 5),
    last: await addProduct(tx, a.storeId, "Last unit", 50_000, 1),
    snapshot: await addProduct(tx, a.storeId, "Snapshot", 20_000, null),
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
    // A second image placed first: the order line takes the lowest position.
    await tx.insert(productImages).values({
      storeId: a.storeId,
      productId: catalogA.wrap.productId,
      r2Key: `test/${catalogA.wrap.productId}-cover.webp`,
      width: 1,
      height: 1,
      position: -1,
    });
  });
  gadgetB = await withStore(b.storeId, (tx) => addProduct(tx, b.storeId, "Gadget", 200_000, null));
  hiddenC = await withStore(c.storeId, (tx) => addProduct(tx, c.storeId, "Hidden", 1_000, null));
});

afterAll(async () => {
  await eraseSellers(owner, userIds);
  await owner.end();
  await db.$client.end();
});

beforeEach(() => updateTag.mockReset());

describe("a placed order", () => {
  let placed: { orderId: string; number: number; totalKobo: number };

  beforeAll(async () => {
    const result = await placeOrder(
      order(a.slug, [
        item(catalogA.wrap.variantId, 150_000, 2),
        item(catalogA.tracked.variantId, 99_000),
      ]),
    );
    if (!result.ok) throw new Error(JSON.stringify(result.error));
    placed = result.data;
  });

  // covers: AC-6, AC-10
  it("gets the store's first number and the right total", () => {
    // 2 × ₦1,500 + 1 × ₦990
    expect(placed).toMatchObject({ number: 1001, totalKobo: 399_000 });
  });

  // covers: AC-6
  it("stores subtotal and total in kobo with no fee or discount", async () => {
    const [row] = await withStore(a.storeId, (tx) =>
      tx.select().from(orders).where(eq(orders.id, placed.orderId)),
    );
    expect(row).toMatchObject({
      subtotalKobo: 399_000,
      deliveryFeeKobo: 0,
      discountKobo: 0,
      totalKobo: 399_000,
      customerPhone: customer.phone,
      deliveryState: "Lagos",
    });
  });

  // covers: AC-7
  it("snapshots name, price, line total and the first image on each line", async () => {
    const lines = await withStore(a.storeId, (tx) =>
      tx.select().from(orderItems).where(eq(orderItems.orderId, placed.orderId)),
    );
    const wrap = lines.find((l) => l.variantId === catalogA.wrap.variantId);
    expect(lines).toHaveLength(2);
    expect(wrap).toMatchObject({
      productName: "Wrap",
      unitPriceKobo: 150_000,
      quantity: 2,
      lineTotalKobo: 300_000,
      variantLabel: null,
      imageKey: `test/${catalogA.wrap.productId}-cover.webp`,
    });
  });

  // covers: AC-7
  it("records one placed event by the customer", async () => {
    const events = await withStore(a.storeId, (tx) =>
      tx.select().from(orderEvents).where(eq(orderEvents.orderId, placed.orderId)),
    );
    expect(events).toEqual([
      expect.objectContaining({ type: "placed", actor: "customer", actorUserId: null }),
    ]);
  });

  // covers: AC-7
  it("takes tracked stock and leaves untracked stock alone", async () => {
    const stock = await withStore(a.storeId, (tx) =>
      tx
        .select({ id: productVariants.id, stock: productVariants.stock })
        .from(productVariants)
        .where(eq(productVariants.storeId, a.storeId)),
    );
    const byId = Object.fromEntries(stock.map((s) => [s.id, s.stock]));
    expect(byId[catalogA.tracked.variantId]).toBe(4);
    expect(byId[catalogA.wrap.variantId]).toBeNull();
  });
});

describe("cache invalidation", () => {
  // covers: AC-7
  it("tags the store and the tracked product when stock changes", async () => {
    await placeOrder(order(a.slug, [item(catalogA.tracked.variantId, 99_000)]));
    expect(updateTag.mock.calls.flat()).toEqual([
      `store:${a.storeId}`,
      `product:${catalogA.tracked.productId}`,
    ]);
  });

  // covers: AC-7
  it("tags nothing for an order of untracked items only", async () => {
    await placeOrder(order(a.slug, [item(catalogA.wrap.variantId, 150_000)]));
    expect(updateTag).not.toHaveBeenCalled();
  });
});

describe("snapshots and customers", () => {
  // covers: AC-7
  it("keeps the old name and price on a line after the product changes", async () => {
    const result = await placeOrder(order(a.slug, [item(catalogA.snapshot.variantId, 20_000)]));
    if (!result.ok) throw new Error(JSON.stringify(result.error));
    await withStore(a.storeId, async (tx) => {
      await tx
        .update(products)
        .set({ name: "Renamed" })
        .where(eq(products.id, catalogA.snapshot.productId));
      await tx
        .update(productVariants)
        .set({ priceKobo: 25_000 })
        .where(eq(productVariants.id, catalogA.snapshot.variantId));
    });
    const [kept] = await withStore(a.storeId, (tx) =>
      tx.select().from(orderItems).where(eq(orderItems.orderId, result.data.orderId)),
    );
    expect(kept).toMatchObject({ productName: "Snapshot", unitPriceKobo: 20_000 });
  });

  // covers: AC-7
  it("reuses the customer for a known phone without overwriting their name", async () => {
    const phone = "+2348099990000";
    const first = await placeOrder(
      order(a.slug, [item(catalogA.wrap.variantId, 150_000)], {
        customer: { name: "First Name", phone },
      }),
    );
    const second = await placeOrder(
      order(a.slug, [item(catalogA.wrap.variantId, 150_000)], {
        customer: { name: "Someone Else", phone, email: "else@example.com" },
      }),
    );
    if (!first.ok || !second.ok) throw new Error("order failed");
    const { placed, stored } = await withStore(a.storeId, async (tx) => {
      const rows = await tx
        .select({ id: orders.id, customerId: orders.customerId, name: orders.customerName })
        .from(orders)
        .where(inArray(orders.id, [first.data.orderId, second.data.orderId]));
      const [customerRow] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, rows[0].customerId));
      return { placed: rows, stored: customerRow };
    });
    const byOrder = Object.fromEntries(placed.map((row) => [row.id, row]));
    expect(byOrder[second.data.orderId].customerId).toBe(byOrder[first.data.orderId].customerId);
    // The order keeps what the guest typed; the customer keeps the first name.
    expect(byOrder[second.data.orderId].name).toBe("Someone Else");
    expect(stored).toMatchObject({ name: "First Name", email: "else@example.com", phone });
  });
});

describe("rejections", () => {
  // covers: AC-8
  it.each([
    [
      "an unpublished store",
      () => order(c.slug, [item(hiddenC.variantId, 1_000)]),
      () => ({ code: "store_unavailable" }),
    ],
    [
      "an unknown store",
      () => order(`nope-${run}`, [item(catalogA.wrap.variantId, 150_000)]),
      () => ({ code: "store_unavailable" }),
    ],
    [
      "a variant from another store",
      () => order(a.slug, [item(gadgetB.variantId, 200_000)]),
      () => ({ code: "item_unavailable", items: [{ variantId: gadgetB.variantId }] }),
    ],
    [
      "an archived variant",
      () => order(a.slug, [item(catalogA.archivedVariant.variantId, 10_000)]),
      () => ({
        code: "item_unavailable",
        items: [{ variantId: catalogA.archivedVariant.variantId }],
      }),
    ],
    [
      "a variant of an archived product",
      () => order(a.slug, [item(catalogA.archived.variantId, 10_000)]),
      () => ({ code: "item_unavailable", items: [{ variantId: catalogA.archived.variantId }] }),
    ],
    [
      "more than the stock left",
      () => order(a.slug, [item(catalogA.tracked.variantId, 99_000, 50)]),
      () => ({
        code: "out_of_stock",
        items: [{ variantId: catalogA.tracked.variantId, available: expect.any(Number) }],
      }),
    ],
    [
      "a stale expected price",
      () => order(a.slug, [item(catalogA.wrap.variantId, 140_000)]),
      () => ({
        code: "price_changed",
        items: [{ variantId: catalogA.wrap.variantId, currentPriceKobo: 150_000 }],
      }),
    ],
  ])("rejects %s, writes nothing and burns no number", async (_, input, error) => {
    const before = await counts(a.storeId);
    expect(await placeOrder(input())).toEqual({ ok: false, error: error() });
    expect(await counts(a.storeId)).toEqual(before);
  });

  // covers: AC-8
  it("lists every stale item with its current price", async () => {
    const result = await placeOrder(
      order(a.slug, [item(catalogA.wrap.variantId, 1), item(catalogA.tracked.variantId, 2)]),
    );
    expect(result).toEqual({
      ok: false,
      error: {
        code: "price_changed",
        items: expect.arrayContaining([
          { variantId: catalogA.wrap.variantId, currentPriceKobo: 150_000 },
          { variantId: catalogA.tracked.variantId, currentPriceKobo: 99_000 },
        ]),
      },
    });
  });

  // covers: AC-8
  it("reports an unavailable item before checking prices", async () => {
    const result = await placeOrder(
      order(a.slug, [item(gadgetB.variantId, 1), item(catalogA.wrap.variantId, 1)]),
    );
    expect(result).toEqual({
      ok: false,
      error: { code: "item_unavailable", items: [{ variantId: gadgetB.variantId }] },
    });
  });
});

describe("place_order checks its own input (Zod skipped)", () => {
  // covers: AC-8
  it.each([
    [
      "a duplicate line",
      () => [line(catalogA.wrap.variantId, 150_000), line(catalogA.wrap.variantId, 150_000)],
      {},
      "items[1].variant_id",
    ],
    ["51 lines", () => Array.from({ length: 51 }, () => line(randomUUID(), 1)), {}, "items"],
    [
      "a 301 character address",
      () => [line(catalogA.wrap.variantId, 150_000)],
      { delivery: { ...delivery, address: "x".repeat(301) } },
      "delivery.address",
    ],
    [
      "a phone that is not E.164",
      () => [line(catalogA.wrap.variantId, 150_000)],
      { customer: { name: "x", phone: "0803" } },
      "customer.phone",
    ],
    [
      "a state outside the list",
      () => [line(catalogA.wrap.variantId, 150_000)],
      { delivery: { ...delivery, state: "Lagos State" } },
      "delivery.state",
    ],
    ["quantity 0", () => [line(catalogA.wrap.variantId, 150_000, 0)], {}, "items[0].quantity"],
  ])("raises RB005 for %s and writes nothing", async (_, items, options, field) => {
    const before = await counts(a.storeId);
    const error = await expectPgCode("RB005", () => placeOrderSql(a.slug, items(), options));
    expect(JSON.parse(error.detail ?? "[]")).toContainEqual({ field });
    expect(await counts(a.storeId)).toEqual(before);
  });

  // covers: AC-8
  it("lists every invalid field at once", async () => {
    const error = await expectPgCode("RB005", () =>
      placeOrderSql(a.slug, [line(catalogA.wrap.variantId, 150_000)], {
        customer: { name: "", phone: "x" },
        delivery: { ...delivery, city: "" },
      }),
    );
    expect(JSON.parse(error.detail ?? "[]")).toEqual([
      { field: "customer.name" },
      { field: "customer.phone" },
      { field: "delivery.city" },
    ]);
  });
});

describe("idempotency", () => {
  // covers: AC-9
  it("returns the original order for a repeated key, even after unpublishing", async () => {
    const idempotencyKey = randomUUID();
    const first = await placeOrder(
      order(a.slug, [item(catalogA.wrap.variantId, 150_000)], { idempotencyKey }),
    );
    const before = await counts(a.storeId);
    await publish(a.storeId, null);
    const again = await placeOrder(
      order(a.slug, [item(catalogA.tracked.variantId, 99_000, 3)], { idempotencyKey }),
    ).finally(() => publish(a.storeId));
    expect(again).toEqual(first);
    expect(await counts(a.storeId)).toEqual(before);
  });

  // covers: AC-9
  it("says the order already existed when called directly", async () => {
    const key = randomUUID();
    const first = await placeOrderSql(a.slug, [line(catalogA.wrap.variantId, 150_000)], { key });
    const again = await placeOrderSql(a.slug, [line(catalogA.wrap.variantId, 150_000)], { key });
    expect(first.existing).toBe(false);
    expect(again).toMatchObject({ order_id: first.order_id, existing: true });
  });
});

describe("concurrency", () => {
  // covers: AC-10
  it("gives 20 parallel orders consecutive numbers with no gaps", async () => {
    const { next } = await counts(a.storeId);
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        placeOrder(order(a.slug, [item(catalogA.wrap.variantId, 150_000)])),
      ),
    );
    const numbers = results.map((r) => (r.ok ? r.data.number : -1)).sort((x, y) => x - y);
    expect(numbers).toEqual(Array.from({ length: 20 }, (_, i) => next + i));
  });

  // covers: AC-10
  it("sells the last unit once when two orders race for it", async () => {
    const results = await Promise.all([
      placeOrder(order(a.slug, [item(catalogA.last.variantId, 50_000)])),
      placeOrder(order(a.slug, [item(catalogA.last.variantId, 50_000)])),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([
      {
        ok: false,
        error: {
          code: "out_of_stock",
          items: [{ variantId: catalogA.last.variantId, available: 0 }],
        },
      },
    ]);
  });
});
