import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// AC-9: the Shop shell and brand marks are Server Components, so a storefront
// ships no shell JavaScript. One "use client" here would pull them all in.
const SERVER_ONLY_DIRS = ["src/components/shop-shell", "src/components/brand"];

const sources = SERVER_ONLY_DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
    .map((file) => join(dir, file)),
);

describe("Shop shell and brand marks", () => {
  it("has source files to check", () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  // covers: AC-9
  it.each(sources)("%s is not a client component", (file) => {
    expect(readFileSync(file, "utf8")).not.toMatch(/^\s*["']use client["']/m);
  });
});
