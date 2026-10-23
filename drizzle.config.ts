import { defineConfig } from "drizzle-kit";

// Migrations run as the owner role on the direct (unpooled) connection.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? "" },
  strict: true,
  verbose: true,
});
