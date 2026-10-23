CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"r2_key" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"price_kobo" bigint NOT NULL,
	"stock" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_price_range" CHECK ("product_variants"."price_kobo" between 1 and 10000000000),
	CONSTRAINT "product_variants_stock_non_negative" CHECK ("product_variants"."stock" >= 0)
);
--> statement-breakpoint
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_name_length" CHECK (char_length("products"."name") between 1 and 120)
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_product_id_position_idx" ON "product_images" USING btree ("product_id","position");--> statement-breakpoint
CREATE INDEX "product_images_store_id_idx" ON "product_images" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_default_idx" ON "product_variants" USING btree ("product_id") WHERE "product_variants"."is_default";--> statement-breakpoint
CREATE INDEX "product_variants_product_id_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variants_store_id_idx" ON "product_variants" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_store_id_slug_idx" ON "products" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "products_store_id_archived_at_created_at_idx" ON "products" USING btree ("store_id","archived_at","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE POLICY "store_slugs_public" ON "store_slugs" AS PERMISSIVE FOR SELECT TO "rubi_public" USING (exists (select 1 from public.stores s where s.id = store_id and s.published_at is not null));--> statement-breakpoint
CREATE POLICY "stores_public" ON "stores" AS PERMISSIVE FOR SELECT TO "rubi_public" USING (published_at is not null);--> statement-breakpoint
CREATE POLICY "product_images_app" ON "product_images" AS PERMISSIVE FOR ALL TO "rubi_app" USING (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid)) WITH CHECK (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "product_images_public" ON "product_images" AS PERMISSIVE FOR SELECT TO "rubi_public" USING (exists (select 1 from public.stores s where s.id = store_id and s.published_at is not null) and exists (select 1 from public.products p where p.id = product_id and p.archived_at is null));--> statement-breakpoint
CREATE POLICY "product_variants_app" ON "product_variants" AS PERMISSIVE FOR ALL TO "rubi_app" USING (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid)) WITH CHECK (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "product_variants_public" ON "product_variants" AS PERMISSIVE FOR SELECT TO "rubi_public" USING (exists (select 1 from public.stores s where s.id = store_id and s.published_at is not null) and archived_at is null and exists (select 1 from public.products p where p.id = product_id and p.archived_at is null));--> statement-breakpoint
CREATE POLICY "products_app" ON "products" AS PERMISSIVE FOR ALL TO "rubi_app" USING (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid)) WITH CHECK (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "products_public" ON "products" AS PERMISSIVE FOR SELECT TO "rubi_public" USING (exists (select 1 from public.stores s where s.id = store_id and s.published_at is not null) and archived_at is null);