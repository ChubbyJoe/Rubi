import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MAX_LINE_QUANTITY, MAX_ORDER_LINES, phoneSchema, placeOrderSchema } from "./schemas";

const item = (overrides: object = {}) => ({
  variantId: randomUUID(),
  quantity: 1,
  expectedUnitPriceKobo: 150_000,
  ...overrides,
});

const order = (overrides: object = {}) => ({
  storeSlug: "ada-fabrics",
  idempotencyKey: randomUUID(),
  customer: { name: "Ada Okafor", phone: "0803 123 4567" },
  delivery: { state: "Lagos", city: "Ikeja", address: "12 Allen Avenue" },
  items: [item()],
  ...overrides,
});

const failedPaths = (input: object) =>
  placeOrderSchema.safeParse(input).error?.issues.map((issue) => issue.path.join("."));

describe("phoneSchema", () => {
  // covers: AC-8
  it.each([
    ["a local number with spaces", "0803 123 4567"],
    ["a local number without spaces", "08031234567"],
    ["an international number", "+234 803 123 4567"],
    ["a number with the country code but no plus", "2348031234567"],
  ])("normalises %s to E.164", (_, input) => {
    expect(phoneSchema.parse(input)).toBe("+2348031234567");
  });

  it.each([
    ["a truncated number", "0803"],
    ["letters", "not a phone"],
    ["an empty string", ""],
  ])("rejects %s", (_, input) => {
    const result = phoneSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Enter a valid phone number");
  });
});

describe("placeOrderSchema", () => {
  it("accepts a complete order and normalises it", () => {
    const parsed = placeOrderSchema.parse(
      order({ storeSlug: " Ada-Fabrics ", customer: { name: " Ada ", phone: "0803 123 4567" } }),
    );
    expect(parsed.storeSlug).toBe("ada-fabrics");
    expect(parsed.customer).toEqual({ name: "Ada", phone: "+2348031234567" });
  });

  it("drops an empty email and blank optional delivery fields", () => {
    const parsed = placeOrderSchema.parse(
      order({
        customer: { name: "Ada", phone: "08031234567", email: "" },
        delivery: { state: "Lagos", city: "Ikeja", address: "12 Allen", landmark: "  ", note: "" },
      }),
    );
    expect(parsed.customer.email).toBeUndefined();
    expect(parsed.delivery.landmark).toBeUndefined();
    expect(parsed.delivery.note).toBeUndefined();
  });

  it("keeps a valid email", () => {
    const parsed = placeOrderSchema.parse(
      order({ customer: { name: "Ada", phone: "08031234567", email: "ada@example.com" } }),
    );
    expect(parsed.customer.email).toBe("ada@example.com");
  });

  it.each([
    [
      "a state outside the list",
      { delivery: { state: "Lagos State", city: "x", address: "x" } },
      "delivery.state",
    ],
    [
      "a 301 character address",
      { delivery: { state: "Lagos", city: "x", address: "x".repeat(301) } },
      "delivery.address",
    ],
    ["a blank city", { delivery: { state: "Lagos", city: " ", address: "x" } }, "delivery.city"],
    ["a blank name", { customer: { name: "", phone: "08031234567" } }, "customer.name"],
    [
      "a bad email",
      { customer: { name: "Ada", phone: "08031234567", email: "ada@" } },
      "customer.email",
    ],
    ["a key that is not a UUID", { idempotencyKey: "abc" }, "idempotencyKey"],
    ["an invalid slug", { storeSlug: "-nope-" }, "storeSlug"],
  ])("rejects %s on that field", (_, overrides, path) => {
    expect(failedPaths(order(overrides))).toContain(path);
  });

  it("reports every failing field at once", () => {
    const paths = failedPaths(
      order({
        customer: { name: "", phone: "x" },
        delivery: { state: "Lagos", city: "", address: "x" },
      }),
    );
    expect(paths).toEqual(
      expect.arrayContaining(["customer.name", "customer.phone", "delivery.city"]),
    );
  });

  describe("items", () => {
    it("needs at least one line", () => {
      expect(failedPaths(order({ items: [] }))).toContain("items");
    });

    it(`accepts ${MAX_ORDER_LINES} lines and rejects ${MAX_ORDER_LINES + 1}`, () => {
      const lines = (n: number) => Array.from({ length: n }, () => item());
      expect(placeOrderSchema.safeParse(order({ items: lines(MAX_ORDER_LINES) })).success).toBe(
        true,
      );
      expect(failedPaths(order({ items: lines(MAX_ORDER_LINES + 1) }))).toContain("items");
    });

    it("rejects the same variant twice", () => {
      const variantId = randomUUID();
      const result = placeOrderSchema.safeParse(
        order({ items: [item({ variantId }), item({ variantId })] }),
      );
      expect(result.error?.issues[0].message).toBe("Each product appears once");
    });

    it.each([
      ["quantity 0", { quantity: 0 }, "items.0.quantity"],
      [
        `quantity ${MAX_LINE_QUANTITY + 1}`,
        { quantity: MAX_LINE_QUANTITY + 1 },
        "items.0.quantity",
      ],
      ["a fractional quantity", { quantity: 1.5 }, "items.0.quantity"],
      ["a negative expected price", { expectedUnitPriceKobo: -1 }, "items.0.expectedUnitPriceKobo"],
      ["a fractional price", { expectedUnitPriceKobo: 1.5 }, "items.0.expectedUnitPriceKobo"],
      ["a variant id that is not a UUID", { variantId: "v1" }, "items.0.variantId"],
    ])("rejects %s", (_, overrides, path) => {
      expect(failedPaths(order({ items: [item(overrides)] }))).toContain(path);
    });

    it(`accepts quantity ${MAX_LINE_QUANTITY} and a free item`, () => {
      const items = [item({ quantity: MAX_LINE_QUANTITY, expectedUnitPriceKobo: 0 })];
      expect(placeOrderSchema.safeParse(order({ items })).success).toBe(true);
    });
  });
});
