import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { placeOrder } from "./place-order";

// The database boundary: withCheckout runs `fn` against this fake tx.
const execute = vi.fn();
vi.mock("@/lib/db", () => ({
  withCheckout: (fn: (tx: unknown) => Promise<unknown>) => fn({ execute }),
}));
const updateTag = vi.fn();
vi.mock("next/cache", () => ({ updateTag: (tag: string) => updateTag(tag) }));

const storeId = randomUUID();
const variantId = randomUUID();

const input = () => ({
  storeSlug: "ada-fabrics",
  idempotencyKey: randomUUID(),
  customer: { name: "Ada", phone: "0803 123 4567" },
  delivery: { state: "Lagos" as const, city: "Ikeja", address: "12 Allen Avenue" },
  items: [{ variantId, quantity: 2, expectedUnitPriceKobo: 150_000 }],
});

const placed = (overrides: object = {}) => ({
  rows: [
    {
      result: {
        order_id: randomUUID(),
        number: 1001,
        total_kobo: 300_000,
        store_id: storeId,
        store_slug: "ada-fabrics",
        product_ids: [],
        existing: false,
        ...overrides,
      },
    },
  ],
});

/** What Drizzle throws: a wrapper whose cause carries the Postgres fields. */
const pgFailure = (code: string, detail: unknown) =>
  Object.assign(new Error("Failed query"), {
    cause: { code, detail: JSON.stringify(detail), message: code },
  });

beforeEach(() => {
  execute.mockReset();
  updateTag.mockReset();
});

describe("placeOrder", () => {
  it("rejects bad input with every failing path and never calls the database", async () => {
    const result = await placeOrder({
      ...input(),
      customer: { name: "", phone: "0803" },
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "invalid_input", fields: ["customer.name", "customer.phone"] },
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it("returns the placed order", async () => {
    const response = placed();
    execute.mockResolvedValue(response);
    const result = await placeOrder(input());
    expect(result).toEqual({
      ok: true,
      data: { orderId: response.rows[0].result.order_id, number: 1001, totalKobo: 300_000 },
    });
  });

  // covers: AC-7
  it("invalidates the store and each product when tracked stock changed", async () => {
    const productIds = [randomUUID(), randomUUID()];
    execute.mockResolvedValue(placed({ product_ids: productIds }));
    await placeOrder(input());
    expect(updateTag.mock.calls.flat()).toEqual([
      `store:${storeId}`,
      `product:${productIds[0]}`,
      `product:${productIds[1]}`,
    ]);
  });

  // covers: AC-7
  it("leaves the cache alone when no tracked stock changed", async () => {
    execute.mockResolvedValue(placed({ product_ids: [] }));
    await placeOrder(input());
    expect(updateTag).not.toHaveBeenCalled();
  });

  // covers: AC-8
  it.each([
    ["RB001", [], { code: "store_unavailable" }],
    ["RB002", [{ variant_id: variantId }], { code: "item_unavailable", items: [{ variantId }] }],
    [
      "RB003",
      [{ variant_id: variantId, current_price_kobo: 160_000 }],
      { code: "price_changed", items: [{ variantId, currentPriceKobo: 160_000 }] },
    ],
    [
      "RB004",
      [{ variant_id: variantId, available: 1 }],
      { code: "out_of_stock", items: [{ variantId, available: 1 }] },
    ],
    [
      "RB005",
      [{ field: "customer.phone" }, { field: "items[0].quantity" }],
      { code: "invalid_input", fields: ["customer.phone", "items[0].quantity"] },
    ],
  ])("maps %s to a typed error", async (code, detail, error) => {
    execute.mockRejectedValue(pgFailure(code, detail));
    expect(await placeOrder(input())).toEqual({ ok: false, error });
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("rethrows a database error that is not a place_order rejection", async () => {
    const failure = pgFailure("40001", []);
    execute.mockRejectedValue(failure);
    await expect(placeOrder(input())).rejects.toBe(failure);
  });

  it("throws when place_order returns a shape it does not expect", async () => {
    execute.mockResolvedValue(placed({ order_id: "not-a-uuid" }));
    await expect(placeOrder(input())).rejects.toThrow();
  });
});
