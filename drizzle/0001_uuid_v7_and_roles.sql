-- Time ordered uuid (version 7). Postgres 17 has no native uuidv7(); swap
-- the column defaults for it in one migration after the move to Postgres 18.
-- Takes a random v4 uuid, overwrites the first 48 bits with the Unix time in
-- milliseconds, and sets the version bits to 7.
CREATE OR REPLACE FUNCTION public.uuid_generate_v7() RETURNS uuid
LANGUAGE sql VOLATILE PARALLEL SAFE
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT encode(
    set_bit(
      set_bit(
        overlay(
          uuid_send(gen_random_uuid())
          PLACING substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3)
          FROM 1 FOR 6
        ),
        52, 1
      ),
      53, 1
    ),
    'hex'
  )::uuid
$$;
--> statement-breakpoint
-- rubi_app may switch into rubi_public (SET LOCAL ROLE) but must not inherit
-- its grants and policies, or withStore(A) would also see every published
-- store's catalog. Neon copies roles into new branches, so this migration
-- (not only scripts/setup-roles.ts) fixes existing branches.
REVOKE rubi_public FROM rubi_app;
--> statement-breakpoint
GRANT rubi_public TO rubi_app WITH INHERIT FALSE, SET TRUE;
