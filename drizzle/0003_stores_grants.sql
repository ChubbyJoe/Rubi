-- stores.slug always points at an existing store_slugs row. Deferred, so a
-- store and its first slug row can be inserted in one transaction.
ALTER TABLE public.stores
  ADD CONSTRAINT stores_slug_store_slugs_slug_fk FOREIGN KEY (slug)
  REFERENCES public.store_slugs (slug) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
-- rubi_app got SELECT, INSERT, UPDATE, DELETE through the default privileges
-- from scripts/setup-roles.ts. Narrow them: no deletes (seller erasure
-- cascades as the table owner), a slug is never renamed (only retired), and
-- the owner and order counter never change through the app.
REVOKE DELETE ON public.stores, public.store_slugs FROM rubi_app;
--> statement-breakpoint
REVOKE UPDATE ON public.store_slugs FROM rubi_app;
--> statement-breakpoint
GRANT UPDATE (retired_at) ON public.store_slugs TO rubi_app;
--> statement-breakpoint
REVOKE UPDATE ON public.stores FROM rubi_app;
--> statement-breakpoint
GRANT UPDATE (name, slug, published_at, updated_at) ON public.stores TO rubi_app;
--> statement-breakpoint
-- Answers whether any store has ever used a slug, without revealing whose.
CREATE OR REPLACE FUNCTION public.slug_available(p_slug text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.store_slugs WHERE slug = p_slug)
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.slug_available(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.slug_available(text) TO rubi_app;
