import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps a type token next to a text color", () => {
    expect(cn("text-display-xl", "text-muted-foreground")).toBe(
      "text-display-xl text-muted-foreground",
    );
  });
  it("lets a later type token replace an earlier one", () => {
    expect(cn("text-body-md", "text-body-sm")).toBe("text-body-sm");
  });
});
