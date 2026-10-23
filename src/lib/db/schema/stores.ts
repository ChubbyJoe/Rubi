import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  createdAt,
  currentStoreId,
  currentUserId,
  id,
  rubiApp,
  storeOwned,
  updatedAt,
} from "./rls";

// `stores.slug` also references `store_slugs.slug` through a DEFERRABLE
// foreign key added in a custom migration (drizzle-kit cannot express it),
// so a store and its first slug row are written in one transaction.
export const stores = pgTable(
  "stores",
  {
    id: id(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    nextOrderNumber: integer("next_order_number").notNull().default(1001),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("stores_name_length", sql`char_length(${t.name}) between 1 and 80`),
    check("stores_slug_format", sql`${t.slug} ~ '^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$'`),
    pgPolicy("stores_app_select", {
      for: "select",
      to: rubiApp,
      using: sql`id = ${currentStoreId} or owner_user_id = ${currentUserId}`,
    }),
    pgPolicy("stores_app_insert", {
      for: "insert",
      to: rubiApp,
      withCheck: sql`owner_user_id = ${currentUserId}`,
    }),
    pgPolicy("stores_app_update", {
      for: "update",
      to: rubiApp,
      using: sql`id = ${currentStoreId} or owner_user_id = ${currentUserId}`,
      withCheck: sql`id = ${currentStoreId} or owner_user_id = ${currentUserId}`,
    }),
  ],
);

// Every slug a store has ever used, current and retired. The primary key
// keeps a slug unique across all stores forever.
export const storeSlugs = pgTable(
  "store_slugs",
  {
    slug: text("slug").primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    retiredAt: timestamp("retired_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("store_slugs_current_idx")
      .on(t.storeId)
      .where(sql`${t.retiredAt} is null`),
    index("store_slugs_store_id_idx").on(t.storeId),
    pgPolicy("store_slugs_app", {
      for: "all",
      to: rubiApp,
      using: storeOwned,
      withCheck: storeOwned,
    }),
  ],
);
