import { sql } from "drizzle-orm";
import {
  bigint,
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
import { productVariants, products } from "./catalog";
import { createdAt, E164, id, oneOf, rubiApp, storeOwned, updatedAt } from "./rls";
import { stores } from "./stores";

// Fixed value sets: each one is a CHECK here and a TypeScript union. Adding
// a value is one migration that swaps the check.
export const ORDER_STATUSES = ["new", "confirmed", "delivered", "cancelled"] as const;
export const PAYMENT_STATUSES = ["unpaid", "part_paid", "paid", "refunded"] as const;
export const ORDER_EVENT_TYPES = [
  "placed",
  "status_changed",
  "edited",
  "payment_recorded",
  "payment_voided",
  "note",
] as const;
export const ORDER_ACTORS = ["customer", "seller", "system"] as const;

// Exact spellings, also checked inside place_order.
export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type OrderEventType = (typeof ORDER_EVENT_TYPES)[number];
export type OrderActor = (typeof ORDER_ACTORS)[number];
export type NigerianState = (typeof NIGERIAN_STATES)[number];

const kobo = (name: string) => bigint(name, { mode: "number" });

export const customers = pgTable(
  "customers",
  {
    id: id(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    // E.164; null once anonymised
    phone: text("phone"),
    name: text("name").notNull(),
    email: text("email"),
    anonymisedAt: timestamp("anonymised_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("customers_store_id_phone_idx")
      .on(t.storeId, t.phone)
      .where(sql`${t.phone} is not null`),
    index("customers_store_id_idx").on(t.storeId),
    check("customers_phone_e164", sql`${t.phone} ~ ${E164}`),
    check("customers_name_length", sql`char_length(${t.name}) between 1 and 100`),
    check("customers_email_length", sql`char_length(${t.email}) <= 254`),
    pgPolicy("customers_app", {
      for: "all",
      to: rubiApp,
      using: storeOwned,
      withCheck: storeOwned,
    }),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: id(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    idempotencyKey: uuid("idempotency_key").notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    status: text("status").$type<OrderStatus>().notNull().default("new"),
    paymentStatus: text("payment_status").$type<PaymentStatus>().notNull().default("unpaid"),
    // What the guest typed, kept even when the customer record differs.
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    customerEmail: text("customer_email"),
    deliveryState: text("delivery_state").$type<NigerianState>().notNull(),
    deliveryCity: text("delivery_city").notNull(),
    deliveryAddress: text("delivery_address").notNull(),
    deliveryLandmark: text("delivery_landmark"),
    deliveryNote: text("delivery_note"),
    subtotalKobo: kobo("subtotal_kobo").notNull(),
    deliveryFeeKobo: kobo("delivery_fee_kobo").notNull().default(0),
    discountKobo: kobo("discount_kobo").notNull().default(0),
    totalKobo: kobo("total_kobo").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("orders_store_id_number_idx").on(t.storeId, t.number),
    uniqueIndex("orders_store_id_idempotency_key_idx").on(t.storeId, t.idempotencyKey),
    index("orders_store_id_created_at_id_idx").on(t.storeId, t.createdAt.desc(), t.id),
    index("orders_store_id_status_created_at_idx").on(t.storeId, t.status, t.createdAt.desc()),
    index("orders_store_id_payment_status_idx").on(t.storeId, t.paymentStatus),
    index("orders_customer_id_idx").on(t.customerId),
    check("orders_status_values", oneOf(t.status, ORDER_STATUSES)),
    check("orders_payment_status_values", oneOf(t.paymentStatus, PAYMENT_STATUSES)),
    check("orders_delivery_state_values", oneOf(t.deliveryState, NIGERIAN_STATES)),
    check(
      "orders_amounts_non_negative",
      sql`${t.subtotalKobo} >= 0 and ${t.deliveryFeeKobo} >= 0 and ${t.discountKobo} >= 0 and ${t.totalKobo} >= 0`,
    ),
    check(
      "orders_total_adds_up",
      sql`${t.totalKobo} = ${t.subtotalKobo} + ${t.deliveryFeeKobo} - ${t.discountKobo}`,
    ),
    check("orders_customer_phone_e164", sql`${t.customerPhone} ~ ${E164}`),
    check("orders_customer_name_length", sql`char_length(${t.customerName}) between 1 and 100`),
    check("orders_customer_email_length", sql`char_length(${t.customerEmail}) <= 254`),
    check("orders_delivery_city_length", sql`char_length(${t.deliveryCity}) between 1 and 80`),
    check(
      "orders_delivery_address_length",
      sql`char_length(${t.deliveryAddress}) between 1 and 300`,
    ),
    check("orders_delivery_landmark_length", sql`char_length(${t.deliveryLandmark}) <= 150`),
    check("orders_delivery_note_length", sql`char_length(${t.deliveryNote}) <= 500`),
    pgPolicy("orders_app", { for: "all", to: rubiApp, using: storeOwned, withCheck: storeOwned }),
  ],
);

// Each line snapshots what was sold, so later catalog edits never change it.
export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    variantLabel: text("variant_label"),
    imageKey: text("image_key"),
    unitPriceKobo: kobo("unit_price_kobo").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalKobo: kobo("line_total_kobo").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("order_items_order_id_idx").on(t.orderId),
    index("order_items_store_id_idx").on(t.storeId),
    check("order_items_quantity_range", sql`${t.quantity} between 1 and 999`),
    check("order_items_unit_price_non_negative", sql`${t.unitPriceKobo} >= 0`),
    check("order_items_line_total", sql`${t.lineTotalKobo} = ${t.unitPriceKobo} * ${t.quantity}`),
    pgPolicy("order_items_app", {
      for: "all",
      to: rubiApp,
      using: storeOwned,
      withCheck: storeOwned,
    }),
  ],
);

// Append only history of every order and money change.
export const orderEvents = pgTable(
  "order_events",
  {
    id: id(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    type: text("type").$type<OrderEventType>().notNull(),
    fromStatus: text("from_status").$type<OrderStatus>(),
    toStatus: text("to_status").$type<OrderStatus>(),
    actor: text("actor").$type<OrderActor>().notNull(),
    actorUserId: text("actor_user_id"),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [
    index("order_events_order_id_created_at_idx").on(t.orderId, t.createdAt),
    index("order_events_store_id_idx").on(t.storeId),
    check("order_events_type_values", oneOf(t.type, ORDER_EVENT_TYPES)),
    check("order_events_actor_values", oneOf(t.actor, ORDER_ACTORS)),
    pgPolicy("order_events_app", {
      for: "all",
      to: rubiApp,
      using: storeOwned,
      withCheck: storeOwned,
    }),
  ],
);
