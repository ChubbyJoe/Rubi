import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { defineConfig } from "vitest/config";

// Two projects: `unit` needs nothing but Node; `db` runs against the Neon
// branch in .env.local (as rubi_app and rubi_public), one file at a time.
const localEnv = existsSync(".env.local") ? parseEnv(readFileSync(".env.local", "utf8")) : {};

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["**/*.db.test.ts"],
          env: { SKIP_ENV_VALIDATION: "1", LOG_LEVEL: "warn" },
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          include: ["{src,scripts}/**/*.db.test.ts"],
          env: { ...localEnv, LOG_LEVEL: "warn" } as Record<string, string>,
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
