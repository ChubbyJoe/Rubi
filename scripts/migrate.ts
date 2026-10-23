// Runs before `next build` on Vercel. Applies pending drizzle-kit migrations
// as the owner role, holding an advisory lock so two builds never migrate
// the same branch at once. Failures are fixed forward.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

const LOCK_KEY = 726_484_001; // any constant, shared by every build

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set");

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("select pg_advisory_lock($1)", [LOCK_KEY]);
    console.log(JSON.stringify({ level: "info", message: "migrations: applying" }));
    await migrate(drizzle({ client }), { migrationsFolder: "./drizzle" });
    console.log(JSON.stringify({ level: "info", message: "migrations: done" }));
  } finally {
    await client.query("select pg_advisory_unlock($1)", [LOCK_KEY]).catch(() => {});
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({ level: "error", message: "migrations: failed", error: String(error) }),
  );
  process.exit(1);
});
