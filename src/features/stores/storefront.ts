import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { withPublic } from "@/lib/db";

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;

export const storeSlugTag = (slug: string) => `store-slug:${slug}`;

/**
 * Cached storefront read. Takes only the slug, never the session.
 * Invalidation is explicit: seller actions call updateTag for every tag.
 *
 * Scaffold placeholder: there is no `stores` table yet (Data model,
 * feature 3), so this proves the rubi_public read path only. Public
 * storefront (feature 7) loads the store here, tags `store:<storeId>`, and
 * calls notFound() for an unknown or unpublished slug.
 */
export async function getStorefront(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag(storeSlugTag(slug));

  if (!SLUG.test(slug)) notFound();

  const [row] = await withPublic(async (tx) => {
    const result = await tx.execute<{ role: string }>(sql`select current_user as role`);
    return result.rows;
  });

  return { slug, readAs: row.role, renderedAt: new Date().toISOString() };
}
