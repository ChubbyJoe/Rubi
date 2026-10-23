import { describe, expect, it } from "vitest";
import { asPgError } from "./errors";

describe("asPgError", () => {
  const pg = { code: "RB003", detail: "[]", message: "price_changed" };

  it("returns a driver error that carries a code", () => {
    expect(asPgError(pg)).toBe(pg);
  });

  it("finds the Postgres fields on the cause of a wrapped Drizzle error", () => {
    const wrapped = Object.assign(new Error("Failed query"), { cause: pg });
    expect(asPgError(wrapped)).toBe(pg);
  });

  it("prefers the outer error when both carry a code", () => {
    const outer = { code: "23505", message: "outer", cause: pg };
    expect(asPgError(outer)).toBe(outer);
  });

  it.each([
    ["a plain Error", new Error("boom")],
    ["null", null],
    ["undefined", undefined],
    ["a string", "23505"],
    ["a numeric code", { code: 23505 }],
    ["a cause without a code", { cause: { message: "x" } }],
  ])("returns undefined for %s", (_, value) => {
    expect(asPgError(value)).toBeUndefined();
  });
});
