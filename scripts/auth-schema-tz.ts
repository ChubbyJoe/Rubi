// The Better Auth CLI writes plain `timestamp` columns. Rubi stores every
// timestamp as timestamptz (UTC), so rewrite them after each generate.
import { readFileSync, writeFileSync } from "node:fs";

const file = "src/lib/db/schema/auth.ts";
const source = readFileSync(file, "utf8");
const fixed = source.replace(
  /timestamp\("([a-z_]+)"\)/g,
  'timestamp("$1", { withTimezone: true })',
);
writeFileSync(file, fixed);
