import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
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
import { createdAt, id, rubiApp, rubiPublic, storeOwned, storePublished, updatedAt } from "./rls";
import { stores } from "./stores";

// The app never deletes products or variants; `archived_at` hides them.
const productNotArchived = sql`exists (select 1 from public.products p where p.id = product_id and p.archived_at is null)`;

export const products = pgTable(
  "products",
  {
    id: id(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("products_store_id_slug_idx").on(t.storeId, t.slug),
    index("products_store_id_archived_at_created_at_idx").on(
      t.storeId,
      t.archivedAt,
      t.createdAt.desc(),
    ),
    check("products_name_length", sql`char_length(${t.name}) between 1 and 120`),
    pgPolicy("products_app", { for: "all", to: rubiApp, using: storeOwned, withCheck: storeOwned }),
    pgPolicy("products_public", {
      for: "select",
      to: rubiPublic,
      using: sql`${storePublished} and archived_at is null`,
    }),
  ],
);

// Price and stock live on variants. Every product has one default variant,
// created in the same transaction as the product.
export const productVariants = pgTable(
  "product_variants",
  {
    id: id(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    priceKobo: bigint("price_kobo", { mode: "number" }).notNull(),
    // null = stock not tracked
    stock: integer("stock"),
    isDefault: boolean("is_default").notNull().default(false),
    position: integer("position").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("product_variants_default_idx")
      .on(t.productId)
      .where(sql`${t.isDefault}`),
    index("product_variants_product_id_idx").on(t.productId),
    index("product_variants_store_id_idx").on(t.storeId),
    check("product_variants_price_range", sql`${t.priceKobo} between 1 and 10000000000`),
    check("product_variants_stock_non_negative", sql`${t.stock} >= 0`),
    pgPolicy("product_variants_app", {
      for: "all",
      to: rubiApp,
      using: storeOwned,
      withCheck: storeOwned,
    }),
    pgPolicy("product_variants_public", {
      for: "select",
      to: rubiPublic,
      using: sql`${storePublished} and archived_at is null and ${productNotArchived}`,
    }),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: id(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    r2Key: text("r2_key").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("product_images_product_id_position_idx").on(t.productId, t.position),
    index("product_images_store_id_idx").on(t.storeId),
    pgPolicy("product_images_app", {
      for: "all",
      to: rubiApp,
      using: storeOwned,
      withCheck: storeOwned,
    }),
    pgPolicy("product_images_public", {
      for: "select",
      to: rubiPublic,
      using: sql`${storePublished} and ${productNotArchived}`,
    }),
  ],
);
