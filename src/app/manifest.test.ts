import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WARM_LIGHT } from "@/lib/design/tokens";
import manifest from "./manifest";

describe("web app manifest", () => {
  const app = manifest();

  // covers: AC-10
  it("lists the 192, 512 and maskable 512 icons", () => {
    expect(app.icons?.map(({ sizes, purpose }) => `${sizes} ${purpose}`)).toEqual([
      "192x192 any",
      "512x512 any",
      "512x512 maskable",
    ]);
  });

  it("points every icon at a committed file in public/", () => {
    const missing = (app.icons ?? [])
      .map(({ src }) => `public${src}`)
      .filter((f) => !existsSync(f));
    expect(missing).toEqual([]);
  });

  it("uses Snow for the background and theme colors", () => {
    expect(app.background_color).toBe(WARM_LIGHT.background);
    expect(app.theme_color).toBe(WARM_LIGHT.background);
  });

  it("opens the seller app standalone", () => {
    expect(app).toMatchObject({ name: "Rubi", start_url: "/app", display: "standalone" });
  });
});

describe("app icons", () => {
  // covers: AC-10
  it("serves the Madder dot SVG favicon and no favicon.ico", () => {
    expect(existsSync("src/app/icon.svg")).toBe(true);
    expect(existsSync("src/app/favicon.ico")).toBe(false);
  });

  it("ships an Apple touch icon", () => {
    expect(existsSync("src/app/apple-icon.png")).toBe(true);
  });
});
