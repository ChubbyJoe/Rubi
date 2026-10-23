import { describe, expect, it } from "vitest";
import { blend, BOUNDARY_MIN, contrastRatio, TEXT_MIN } from "./contrast";
import {
  ADMIN_DARK,
  DARK_STATUS_FILL,
  SAMPLE_STONE_THEME,
  STATUS_TONES,
  STONE_LIGHT,
  WARM_LIGHT,
} from "./tokens";

type Palette = Record<string, string>;

// Stone only overrides neutrals; primary and the rest fall through from :root.
const SURFACES: Record<string, Palette> = {
  "warm light": WARM_LIGHT,
  "stone light": { ...WARM_LIGHT, ...STONE_LIGHT },
  "admin dark": {
    ...ADMIN_DARK,
    ...Object.fromEntries(
      STATUS_TONES.map((tone) => [
        `status-${tone}`,
        blend(ADMIN_DARK[`status-${tone}-foreground`], ADMIN_DARK.background, DARK_STATUS_FILL),
      ]),
    ),
  },
};

type Pair = readonly [fg: string, bg: string, min: number];

const pairs = (surface: string): Pair[] => [
  ...["foreground", "body", "muted-foreground"].flatMap((fg) =>
    ["background", "muted", "secondary"].map((bg) => [fg, bg, TEXT_MIN] as const),
  ),
  ["primary-foreground", "primary", TEXT_MIN],
  ["primary-foreground", "primary-active", TEXT_MIN],
  ["destructive", "background", TEXT_MIN],
  ["destructive-foreground", "destructive", TEXT_MIN],
  ["destructive-foreground", "destructive-active", TEXT_MIN],
  ...STATUS_TONES.map((t) => [`status-${t}-foreground`, `status-${t}`, TEXT_MIN] as const),
  ["toast-foreground", "toast", TEXT_MIN],
  ["legal-link", "background", TEXT_MIN],
  ["input", "background", BOUNDARY_MIN],
  ["input", "muted", BOUNDARY_MIN],
  ["input", "secondary", BOUNDARY_MIN],
  ["ring", "background", BOUNDARY_MIN],
  ["ring", "muted", BOUNDARY_MIN],
  ...(surface === "stone light"
    ? []
    : ([
        ["nav-indicator", "muted", BOUNDARY_MIN],
        ["nav-indicator", "secondary", BOUNDARY_MIN],
      ] as const)),
];

describe("token contrast (WCAG 2.2 AA)", () => {
  for (const [surface, palette] of Object.entries(SURFACES)) {
    describe(surface, () => {
      it.each(pairs(surface))("%s on %s reaches %d:1", (fg, bg, min) => {
        expect(palette[fg], fg).toBeDefined();
        expect(palette[bg], bg).toBeDefined();
        expect(contrastRatio(palette[fg], palette[bg])).toBeGreaterThanOrEqual(min);
      });
    });
  }

  describe("sample stone theme", () => {
    const t = SAMPLE_STONE_THEME;
    it("on accent text reads on the accent and its press state", () => {
      expect(contrastRatio(t.onAccent, t.accent)).toBeGreaterThanOrEqual(TEXT_MIN);
      expect(contrastRatio(t.onAccent, t.accentActive)).toBeGreaterThanOrEqual(TEXT_MIN);
    });
    it("focus ring stands out on the stone canvas", () => {
      expect(contrastRatio(t.ring, STONE_LIGHT.background)).toBeGreaterThanOrEqual(BOUNDARY_MIN);
    });
  });
});

describe("contrast helpers", () => {
  it("measures black on white at 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });
  it("blends gamma encoded channels like color-mix in srgb", () => {
    expect(blend("#ffffff", "#000000", 0.5)).toBe("#808080");
  });
  it("rejects anything but #rrggbb", () => {
    expect(() => contrastRatio("red", "#ffffff")).toThrow();
  });
});
