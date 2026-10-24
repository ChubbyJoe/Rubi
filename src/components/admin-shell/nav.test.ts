import { describe, expect, it } from "vitest";
import { ADMIN_NAV, isActiveNav } from "./nav";

describe("isActiveNav", () => {
  // covers: AC-8
  it("marks the Admin home active only on /app itself", () => {
    expect(isActiveNav("/app", "/app")).toBe(true);
    expect(isActiveNav("/app/orders", "/app")).toBe(false);
    expect(isActiveNav("/app/setup", "/app")).toBe(false);
  });

  it("marks a section active on its own path and every page under it", () => {
    expect(isActiveNav("/app/orders", "/app/orders")).toBe(true);
    expect(isActiveNav("/app/orders/123", "/app/orders")).toBe(true);
  });

  it("does not match a sibling that only shares a prefix", () => {
    expect(isActiveNav("/app/orders-archive", "/app/orders")).toBe(false);
  });

  it("does not match another section", () => {
    expect(isActiveNav("/app/products", "/app/orders")).toBe(false);
  });
});

describe("ADMIN_NAV", () => {
  // covers: AC-8
  it("keeps at most four items in the bottom tab bar", () => {
    expect(ADMIN_NAV.filter((item) => item.tab).length).toBeLessThanOrEqual(4);
  });

  it("starts with Home at /app", () => {
    expect(ADMIN_NAV[0]).toMatchObject({ href: "/app", label: "Home", tab: true });
  });

  it("lists every route once", () => {
    const hrefs = ADMIN_NAV.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
