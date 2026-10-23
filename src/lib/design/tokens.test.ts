import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ADMIN_DARK,
  SAMPLE_STONE_THEME,
  SCRIM,
  STATUS_TONES,
  STONE_LIGHT,
  STONE_THEME_OWNED,
  WARM_LIGHT,
} from "./tokens";

const css = readFileSync("src/app/globals.css", "utf8");
const designMd = readFileSync("DESIGN.md", "utf8");

/** The `{ ... }` body that follows the first occurrence of `selector`. */
const block = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`No block for ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`Unclosed block for ${selector}`);
};

/** Custom properties declared in a block, values with whitespace collapsed. */
const declarations = (body: string) =>
  Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")").trim().toLowerCase(),
    ]),
  );

const ROOT = declarations(block(":root"));
const STONE = declarations(block(`html:has([data-neutrals="stone"])`));
const DARK = declarations(block(`html:has([data-surface="admin"])`));

describe("globals.css mirrors tokens.ts", () => {
  it.each(Object.entries(WARM_LIGHT))(":root --%s is %s", (name, value) => {
    expect(ROOT[name]).toBe(value);
  });

  it.each(Object.entries(STONE_LIGHT).filter(([n]) => !STONE_THEME_OWNED.includes(n as never)))(
    "stone --%s is %s",
    (name, value) => {
      expect(STONE[name]).toBe(value);
    },
  );

  it("stone never sets primary or ring, so the seller theme owns them", () => {
    expect(Object.keys(STONE).filter((n) => n.startsWith("primary") || n === "ring")).toEqual([]);
  });

  it.each(Object.entries(ADMIN_DARK))("dark --%s is %s", (name, value) => {
    expect(DARK[name]).toBe(value);
  });

  it.each(STATUS_TONES)(
    "dark status %s fill mixes 16 percent of its text over the canvas",
    (tone) => {
      expect(DARK[`status-${tone}`]).toBe(
        `color-mix(in srgb, var(--status-${tone}-foreground) 16%, var(--background))`,
      );
    },
  );

  it("scrim is 50% black light, 60% dark", () => {
    expect(ROOT.scrim).toBe(SCRIM.light);
    expect(DARK.scrim).toBe(SCRIM.dark);
  });

  it("declares no hex color that tokens.ts does not know", () => {
    const known = new Set([
      ...Object.values(WARM_LIGHT),
      ...Object.values(STONE_LIGHT),
      ...Object.values(ADMIN_DARK),
    ]);
    const unknown = [...css.matchAll(/#[0-9a-f]{6}\b/gi)]
      .map(([hex]) => hex.toLowerCase())
      .filter((hex) => !known.has(hex as never));
    expect(unknown).toEqual([]);
  });
});

describe("DESIGN.md front matter", () => {
  const frontMatter = designMd.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";

  it("exists", () => {
    expect(frontMatter.length).toBeGreaterThan(0);
  });

  it("uses only hex values that exist in tokens.ts", () => {
    const known = new Set<string>([
      ...Object.values(WARM_LIGHT),
      ...Object.values(STONE_LIGHT),
      ...Object.values(ADMIN_DARK),
      ...Object.values(SAMPLE_STONE_THEME),
    ]);
    const unknown = [...frontMatter.matchAll(/#[0-9a-f]{6}\b/gi)]
      .map(([hex]) => hex.toLowerCase())
      .filter((hex) => !known.has(hex));
    expect(unknown).toEqual([]);
  });
});
