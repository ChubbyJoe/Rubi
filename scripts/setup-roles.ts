// One time setup on the Neon `main` branch, before any other branch exists,
// so every branch inherits the roles with the same passwords. Safe to rerun.
//
// rubi_app:    runtime role, LOGIN, no BYPASSRLS. Gets table grants by default.
// rubi_public: NOLOGIN, read only; rubi_app switches into it with SET LOCAL
//              ROLE. Its grants and RLS policies come with the Data model.
//
// Created in SQL, not the Neon API: API roles join neon_superuser, which
// bypasses RLS.
import { Client } from "pg";

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED;
  const password = process.env.RUBI_APP_DB_PASSWORD;
  if (!url || !password) throw new Error("DATABASE_URL_UNPOOLED and RUBI_APP_DB_PASSWORD are required");

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query<{ owner: string; db: string }>(
      "select current_user as owner, current_database() as db",
    );
    const { owner, db } = rows[0];
    const quotedPassword = (await client.query<{ q: string }>("select quote_literal($1) as q", [password])).rows[0].q;

    await client.query("begin");
    await client.query(`
      do $$ begin
        if not exists (select from pg_roles where rolname = 'rubi_app') then
          create role rubi_app login nobypassrls;
        end if;
        if not exists (select from pg_roles where rolname = 'rubi_public') then
          create role rubi_public nologin nobypassrls;
        end if;
      end $$`);
    await client.query(`alter role rubi_app with login nobypassrls password ${quotedPassword}`);
    await client.query("grant rubi_public to rubi_app");
    await client.query(`grant connect on database "${db}" to rubi_app`);
    await client.query("grant usage on schema public to rubi_app, rubi_public");
    await client.query(
      `alter default privileges for role "${owner}" in schema public
         grant select, insert, update, delete on tables to rubi_app`,
    );
    await client.query(
      `alter default privileges for role "${owner}" in schema public
         grant usage, select on sequences to rubi_app`,
    );
    await client.query("commit");
    console.log(JSON.stringify({ level: "info", message: "roles: ready", owner, db }));
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ level: "error", message: "roles: failed", error: String(error) }));
  process.exit(1);
});
