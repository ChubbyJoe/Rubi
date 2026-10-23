import { sql } from "drizzle-orm";
import { pgRole, timestamp, uuid } from "drizzle-orm/pg-core";

// Both roles are created by scripts/setup-roles.ts; drizzle-kit only
// references them in policies.
export const rubiApp = pgRole("rubi_app").existing();
export const rubiPublic = pgRole("rubi_public").existing();

// Wrapped in a subselect so Postgres evaluates the setting once per query,
// not once per row. An unset or empty setting is null and matches nothing.
export const currentStoreId = sql`(select nullif(current_setting('app.store_id', true), '')::uuid)`;
export const currentUserId = sql`(select nullif(current_setting('app.user_id', true), ''))`;

export const storeOwned = sql`store_id = ${currentStoreId}`;

// The store row is visible to rubi_public only once published.
export const storePublished = sql`exists (select 1 from public.stores s where s.id = store_id and s.published_at is not null)`;

export const id = () =>
  uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v7()`);

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();
