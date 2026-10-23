import { describe, expect, it } from "vitest";
import { SAMPLE_STONE_THEME } from "@/lib/design/tokens";
import { DEFAULT_SHOP_THEME, resolveShopTheme, shopThemeCss, type ShopTheme } from "./shop-theme";

const stone: ShopTheme = { ...SAMPLE_STONE_THEME, neutrals: "stone" };

describe("shopThemeCss", () => {
  // covers: AC-4
  it("emits nothing for the default theme", () => {
    expect(shopThemeCss(DEFAULT_SHOP_THEME)).toBeNull();
    expect(shopThemeCss({ ...DEFAULT_SHOP_THEME, accent: "#A31621" })).toBeNull();
  });

  it("emits one shop rule with the five theme variables", () => {
    expect(shopThemeCss(stone)).toBe(
      'html:has([data-surface="shop"]){--primary:#0f766e;--primary-foreground:#fafaf9;' +
        "--primary-active:#0b5e58;--primary-tint:#d0e2e0;--ring:#0f766e}",
    );
  });

  it.each([
    ["accent", "red;}body{display:none"],
    ["onAccent", "#fff"],
    ["accentActive", "rgb(0 0 0)"],
    ["accentTint", "#0f766e;"],
    ["ring", ""],
  ] as const)("refuses an unsafe %s (%s)", (key, value) => {
    expect(shopThemeCss({ ...stone, [key]: value })).toBeNull();
  });
});

describe("resolveShopTheme", () => {
  it("keeps a valid theme", () => {
    expect(resolveShopTheme(stone)).toBe(stone);
  });

  it("falls back to the default when any value is unsafe", () => {
    expect(resolveShopTheme({ ...stone, accent: "red;}body{display:none" })).toBe(
      DEFAULT_SHOP_THEME,
    );
    expect(resolveShopTheme({ ...stone, neutrals: "dark" as never })).toBe(DEFAULT_SHOP_THEME);
  });
});
