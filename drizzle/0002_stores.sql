CREATE TABLE "store_slugs" (
	"slug" text PRIMARY KEY NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retired_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "store_slugs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"published_at" timestamp with time zone,
	"next_order_number" integer DEFAULT 1001 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stores_owner_user_id_unique" UNIQUE("owner_user_id"),
	CONSTRAINT "stores_slug_unique" UNIQUE("slug"),
	CONSTRAINT "stores_name_length" CHECK (char_length("stores"."name") between 1 and 80),
	CONSTRAINT "stores_slug_format" CHECK ("stores"."slug" ~ '^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$')
);
--> statement-breakpoint
ALTER TABLE "stores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "store_slugs" ADD CONSTRAINT "store_slugs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "store_slugs_current_idx" ON "store_slugs" USING btree ("store_id") WHERE "store_slugs"."retired_at" is null;--> statement-breakpoint
CREATE INDEX "store_slugs_store_id_idx" ON "store_slugs" USING btree ("store_id");--> statement-breakpoint
CREATE POLICY "store_slugs_app" ON "store_slugs" AS PERMISSIVE FOR ALL TO "rubi_app" USING (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid)) WITH CHECK (store_id = (select nullif(current_setting('app.store_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "stores_app_select" ON "stores" AS PERMISSIVE FOR SELECT TO "rubi_app" USING (id = (select nullif(current_setting('app.store_id', true), '')::uuid) or owner_user_id = (select nullif(current_setting('app.user_id', true), '')));--> statement-breakpoint
CREATE POLICY "stores_app_insert" ON "stores" AS PERMISSIVE FOR INSERT TO "rubi_app" WITH CHECK (owner_user_id = (select nullif(current_setting('app.user_id', true), '')));--> statement-breakpoint
CREATE POLICY "stores_app_update" ON "stores" AS PERMISSIVE FOR UPDATE TO "rubi_app" USING (id = (select nullif(current_setting('app.store_id', true), '')::uuid) or owner_user_id = (select nullif(current_setting('app.user_id', true), ''))) WITH CHECK (id = (select nullif(current_setting('app.store_id', true), '')::uuid) or owner_user_id = (select nullif(current_setting('app.user_id', true), '')));