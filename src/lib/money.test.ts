import { describe, expect, it } from "vitest";
import { formatNaira } from "./money";

// Intl puts a non breaking space in some locales; compare on plain spaces.
const shown = (kobo: number) => formatNaira(kobo).replace(/ /g, " ");

describe("formatNaira", () => {
  // covers: AC-6
  it("shows kobo as naira with two decimals and grouping", () => {
    expect(shown(150_000)).toBe("₦1,500.00");
  });

  it("keeps the kobo part", () => {
    expect(shown(399_050)).toBe("₦3,990.50");
  });

  it("shows zero as ₦0.00", () => {
    expect(shown(0)).toBe("₦0.00");
  });

  it("formats large totals without losing precision", () => {
    expect(shown(123_456_789_00)).toBe("₦123,456,789.00");
  });
});
