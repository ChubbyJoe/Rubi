-- rubi_public reads the storefront through column level SELECT grants only;
-- the TO rubi_public policies limit it to published, non archived rows.
-- Never granted: stores.owner_user_id, stores.next_order_number, and any
-- order or customer table. Each new public column needs its own grant.
GRANT SELECT (id, name, slug, published_at) ON public.stores TO rubi_public;
--> statement-breakpoint
GRANT SELECT (slug, store_id, retired_at) ON public.store_slugs TO rubi_public;
--> statement-breakpoint
GRANT SELECT (id, store_id, name, slug, description, archived_at) ON public.products TO rubi_public;
--> statement-breakpoint
GRANT SELECT (id, store_id, product_id, price_kobo, stock, is_default, position, archived_at)
  ON public.product_variants TO rubi_public;
--> statement-breakpoint
GRANT SELECT ON public.product_images TO rubi_public;
--> statement-breakpoint
-- Products and variants are archived, never deleted, by the app.
REVOKE DELETE ON public.products, public.product_variants FROM rubi_app;
