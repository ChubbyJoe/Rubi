CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"store_id" uuid NOT NULL,
	"phone" text,
	"name" text NOT NULL,
	"email" text,
	"anonymised_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_phone_e164" CHECK ("customers"."phone" ~ '^\+[1-9][0-9]{7,14}$'),
	CONSTRAINT "customers_name_length" CHECK (char_length("customers"."name") between 1 and 100),
	CONSTRAINT "customers_email_length" CHECK (char_length("customers"."email") <= 254)
);
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"type" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"actor" text NOT NULL,
	"actor_user_id" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_events_type_values" CHECK ("order_events"."type" in ('placed', 'status_changed', 'edited', 'payment_recorded', 'payment_voided', 'note')),
	CONSTRAINT "order_events_actor_values" CHECK ("order_events"."actor" in ('customer', 'seller', 'system'))
);
--> statement-breakpoint
ALTER TABLE "order_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid,
	"product_id" uuid,
	"product_name" text NOT NULL,
	"variant_label" text,
	"image_key" text,
	"unit_price_kobo" bigint NOT NULL,
	"quantity" integer NOT NULL,
	"line_total_kobo" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_quantity_range" CHECK ("order_items"."quantity" between 1 and 999),
	CONSTRAINT "order_items_unit_price_non_negative" CHECK ("order_items"."unit_price_kobo" >= 0),
	CONSTRAINT "order_items_line_total" CHECK ("order_items"."line_total_kobo" = "order_items"."unit_price_kobo" * "order_items"."quantity")
);
--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"store_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"customer_email" text,
	"delivery_state" text NOT NULL,
	"delivery_city" text NOT NULL,
	"delivery_address" text NOT NULL,
	"delivery_landmark" text,
	"delivery_note" text,
	"subtotal_kobo" bigint NOT NULL,
	"delivery_fee_kobo" bigint DEFAULT 0 NOT NULL,
	"discount_kobo" bigint DEFAULT 0 NOT NULL,
	"total_kobo" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_status_values" CHECK ("orders"."status" in ('new', 'confirmed', 'delivered', 'cancelled')),
	CONSTRAINT "orders_payment_status_values" CHECK ("orders"."payment_status" in ('unpaid', 'part_paid', 'paid', 'refunded')),
	CONSTRAINT "orders_delivery_state_values" CHECK ("orders"."delivery_state" in ('Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara')),
	CONSTRAINT "orders_amounts_non_negative" CHECK ("orders"."subtotal_kobo" >= 0 and "orders"."delivery_fee_kobo" >= 0 and "orders"."discount_kobo" >= 0 and "orders"."total_kobo" >= 0),
	CONSTRAINT "orders_total_adds_up" CHECK ("orders"."total_kobo" = "orders"."subtotal_kobo" + "orders"."delivery_fee_kobo" - "orders"."discount_kobo"),
	CONSTRAINT "orders_customer_phone_e164" CHECK ("orders"."customer_phone" ~ '^\+[1-9][0-9]{7,14}$'),
	CONSTRAINT "orders_customer_name_length" CHECK (char_length("orders"."customer_name") between 1 and 100),
	CONSTRAINT "orders_customer_email_length" CHECK (char_length("orders"."customer_email") <= 254),
	CONSTRAINT "orders_delivery_city_length" CHECK (char_length("orders"."delivery_city") between 1 and 80),
	CONSTRAINT "orders_delivery_address_length" CHECK (char_length("orders"."delivery_address") between 1 and 300),
	CONSTRAINT "orders_delivery_landmark_length" CHECK (char_length("orders"."delivery_landmark") <= 150),
	CONSTRAINT "orders_delivery_note_length" CHECK (char_length("orders"."delivery_note") <= 500)
);
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_store_id_phone_idx" ON "customers" USING btree ("store_id","phone") WHERE "customers"."phone" is not null;--> statement-breakpoint
CREATE INDEX "customers_store_id_idx" ON "customers" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "order_events_order_id_created_at_idx" ON "order_events" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "order_events_store_id_idx" ON "order_events" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_store_id_idx" ON "order_items" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_store_id_number_idx" ON "orders" USING btree ("store_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_store_id_idempotency_key_idx" ON "orders" USING btree ("store_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "orders_store_id_created_at_id_idx" ON "orders" USING btree ("store_id","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "orders_store_id_status_created_at_idx" ON "orders" USING btree ("store_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "orders_store_id_payment_status_idx" ON "orders" USING btree ("store_id","payment_status");--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE POLICY "customers_app" ON "customers" AS PERMISSIVE FOR ALL TO "rubi_app" USING (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid)) WITH CHECK (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "order_events_app" ON "order_events" AS PERMISSIVE FOR ALL TO "rubi_app" USING (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid)) WITH CHECK (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "order_items_app" ON "order_items" AS PERMISSIVE FOR ALL TO "rubi_app" USING (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid)) WITH CHECK (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "orders_app" ON "orders" AS PERMISSIVE FOR ALL TO "rubi_app" USING (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid)) WITH CHECK (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid));