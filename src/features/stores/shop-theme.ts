import { WARM_LIGHT } from "@/lib/design/tokens";

/** A shop's look (spec 0003). Feature 13 derives and stores real themes. */
export type ShopTheme = {
  /** #rrggbb, becomes --primary. */
  readonly accent: string;
  /** --primary-foreground. */
  readonly onAccent: string;
  /** --primary-active. */
  readonly accentActive: string;
  /** --primary-tint. */
  readonly accentTint: string;
  /** The accent when it reaches 3:1 on the canvas, else ink. */
  readonly ring: string;
  readonly neutrals: "warm" | "stone";
};

export const DEFAULT_SHOP_THEME: ShopTheme = {
  accent: WARM_LIGHT.primary,
  onAccent: WARM_LIGHT["primary-foreground"],
  accentActive: WARM_LIGHT["primary-active"],
  accentTint: WARM_LIGHT["primary-tint"],
  ring: WARM_LIGHT.ring,
  neutrals: "warm",
};

const HEX = /^#[0-9a-f]{6}$/i;
const COLORS = ["accent", "onAccent", "accentActive", "accentTint", "ring"] as const;

const isValid = (theme: ShopTheme) =>
  COLORS.every((key) => HEX.test(theme[key])) &&
  (theme.neutrals === "warm" || theme.neutrals === "stone");

const isDefault = (theme: ShopTheme) =>
  theme.neutrals === DEFAULT_SHOP_THEME.neutrals &&
  COLORS.every((key) => theme[key].toLowerCase() === DEFAULT_SHOP_THEME[key].toLowerCase());

/** The theme itself when every value is safe to put in CSS, else the default. */
export const resolveShopTheme = (theme: ShopTheme): ShopTheme =>
  isValid(theme) ? theme : DEFAULT_SHOP_THEME;

/**
 * CSS for a non default theme, or null for the default or any invalid value.
 * Same specificity as the stone neutrals block and later in the document, so
 * the seller's values win. Only `#rrggbb` values ever reach the output.
 */
export function shopThemeCss(theme: ShopTheme): string | null {
  if (!isValid(theme) || isDefault(theme)) return null;
  return (
    `html:has([data-surface="shop"]){` +
    `--primary:${theme.accent};` +
    `--primary-foreground:${theme.onAccent};` +
    `--primary-active:${theme.accentActive};` +
    `--primary-tint:${theme.accentTint};` +
    `--ring:${theme.ring}}`
  );
}
