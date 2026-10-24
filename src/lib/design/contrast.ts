// WCAG 2.2 contrast, pure. Colors are #rrggbb strings, as in tokens.ts.

export const TEXT_MIN = 4.5;
export const BOUNDARY_MIN = 3;

const HEX = /^#[0-9a-f]{6}$/i;

const channels = (hex: string): readonly [number, number, number] => {
  if (!HEX.test(hex)) throw new Error(`Not a #rrggbb color: ${hex}`);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as unknown as readonly [
    number,
    number,
    number,
  ];
};

const linear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminance = (hex: string) => {
  const [r, g, b] = channels(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * `color-mix(in srgb, fg <amount>, bg)`: mixes the gamma encoded channels,
 * as the browser does, so tests measure the fill the page really paints.
 */
export const blend = (fg: string, bg: string, amount: number) => {
  const f = channels(fg);
  const b = channels(bg);
  return `#${f
    .map((c, i) => Math.round(c * amount + b[i] * (1 - amount)))
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
};
