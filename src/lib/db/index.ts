// No "server-only" here: the Better Auth CLI loads this file. t3 env already
// throws if a server variable is read on the client.
import { attachDatabasePool } from "@vercel/functions";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Runtime connections use rubi_app (no BYPASSRLS) on the pooled host.
// The pooler runs in transaction mode: never use a session level SET,
// only set_config(..., true) and SET LOCAL inside a transaction.
const pool = new Pool({
  host: env.PGHOST,
  database: env.PGDATABASE,
  user: "rubi_app",
  password: env.RUBI_APP_DB_PASSWORD,
  ssl: true,
  max: 5,
  idleTimeoutMillis: 5_000,
});

attachDatabasePool(pool);

export const db = drizzle({ client: pool, schema });

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Runs `fn` in a transaction scoped to one store. RLS policies compare
 * `store_id` to `app.store_id`. `storeId` must come from
 * `getSellerContext()`, never from client input.
 */
export function withStore<T>(storeId: string, fn: (tx: Tx) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.store_id', ${storeId}, true)`);
    return fn(tx);
  });
}

/**
 * Runs `fn` in a transaction that knows only the signed in user, to find
 * (or create) that user's store. `userId` must come from the session.
 */
export function withUser<T>(userId: string, fn: (tx: Tx) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
    return fn(tx);
  });
}

/**
 * Store setup only. Picks a fresh store id and sets both `app.user_id` and
 * `app.store_id`, so the store and its first `store_slugs` row are written
 * under the normal policies in one transaction.
 */
export function withNewStore<T>(userId: string, fn: (tx: Tx, storeId: string) => Promise<T>) {
  return db.transaction(async (tx) => {
    const result = await tx.execute<{ id: string }>(sql`select public.uuid_generate_v7() as id`);
    const storeId = result.rows[0].id;
    await tx.execute(
      sql`select set_config('app.user_id', ${userId}, true), set_config('app.store_id', ${storeId}, true)`,
    );
    return fn(tx, storeId);
  });
}

/**
 * Runs `fn` as rubi_public (read only, published rows only). Storefront
 * reads go through here and never touch the session, cookies or headers.
 */
export function withPublic<T>(fn: (tx: Tx) => Promise<T>) {
  return db.transaction(
    async (tx) => {
      await tx.execute(sql`set local role rubi_public`);
      return fn(tx);
    },
    { accessMode: "read only" },
  );
}
