// The seed guard fails closed. Each case must refuse before touching the
// database, so none of these runs writes anything.
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const seed = (env: Record<string, string>) =>
  spawnSync("node_modules/.bin/tsx", ["scripts/seed.ts"], {
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 30_000,
  });

describe("db:seed guard", () => {
  // covers: AC-14
  it("refuses when NEON_MAIN_ENDPOINT_ID is unset", () => {
    const result = seed({ NEON_MAIN_ENDPOINT_ID: "" });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("NEON_MAIN_ENDPOINT_ID is not set");
  });

  // covers: AC-14
  it("refuses when PGHOST points at the main endpoint", () => {
    const result = seed({
      NEON_MAIN_ENDPOINT_ID: "ep-test-main",
      PGHOST: "ep-test-main-pooler.example",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("production main branch");
  });

  // covers: AC-14
  it("refuses when DATABASE_URL_UNPOOLED points at the main endpoint", () => {
    const result = seed({
      NEON_MAIN_ENDPOINT_ID: "ep-test-main",
      DATABASE_URL_UNPOOLED: "postgresql://x@ep-test-main.example/db",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("production main branch");
  });

  // covers: AC-14
  it("refuses in a production deployment", () => {
    const result = seed({ VERCEL_ENV: "production" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("VERCEL_ENV is production");
  });
});
