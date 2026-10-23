import { describe, expect, it } from "vitest";
import { createStoreSchema, storeSlugSchema } from "./schemas";

describe("storeSlugSchema", () => {
  // covers: AC-5
  it.each(["a", "ada-fabrics", "shop1", "a".repeat(50), "1-2-3"])("accepts %s", (slug) => {
    expect(storeSlugSchema.safeParse(slug).success).toBe(true);
  });

  it("trims and lowercases before checking", () => {
    expect(storeSlugSchema.parse("  Ada-Fabrics ")).toBe("ada-fabrics");
  });

  it.each([
    ["empty", ""],
    ["51 characters", "a".repeat(51)],
    ["a leading hyphen", "-ada"],
    ["a trailing hyphen", "ada-"],
    ["an underscore", "ada_fabrics"],
    ["a space inside", "ada fabrics"],
    ["a dot", "ada.fabrics"],
    ["non ASCII letters", "àdá"],
    ["the storefront placeholder", "__shell__"],
  ])("rejects %s", (_, slug) => {
    expect(storeSlugSchema.safeParse(slug).success).toBe(false);
  });
});

describe("createStoreSchema", () => {
  it("accepts a name and slug and trims the name", () => {
    expect(createStoreSchema.parse({ name: "  Ada Fabrics ", slug: "ada-fabrics" })).toEqual({
      name: "Ada Fabrics",
      slug: "ada-fabrics",
    });
  });

  it("rejects a blank name with a message for the field", () => {
    const result = createStoreSchema.safeParse({ name: "   ", slug: "ada" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["name"],
      message: "Enter your store name",
    });
  });

  it("rejects a name over 80 characters", () => {
    expect(createStoreSchema.safeParse({ name: "x".repeat(81), slug: "ada" }).success).toBe(false);
  });
});
