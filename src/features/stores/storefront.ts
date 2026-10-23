import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { withPublic } from "@/lib/db";
import { stores, storeSlugs } from "@/lib/db/schema";
import { STORE_SLUG } from "./schemas";

export const storeSlugTag = (slug: string) => `store-slug:${slug}`;
export const storeTag = (storeId: string) => `store:${storeId}`;

/**
 * Cache Components needs at least one param from generateStaticParams. This
 * placeholder fails the slug pattern, so it renders not found; real store
 * pages render on first visit and then live in the ISR cache.
 */
export const PLACEHOLDER_SLUG = "__shell__";

export type ResolvedStore = {
  readonly storeId: string;
  readonly currentSlug: string;
  /** Shown in the shop header (spec 0003). */
  readonly name: string;
  /** True when `slug` is an old slug; the route redirects to `currentSlug`. */
  readonly retired: boolean;
};

/**
 * Cached storefront lookup of a current or retired slug, read as
 * rubi_public, so unknown and unpublished stores are both not found. Takes
 * only the slug, never the session. Seller actions call updateTag for
 * `store-slug:<slug>` and `store:<id>`.
 */
export async function resolveStoreSlug(slug: string): Promise<ResolvedStore> {
  "use cache";
  cacheLife("days");
  cacheTag(storeSlugTag(slug));

  if (!STORE_SLUG.test(slug)) notFound();

  const [row] = await withPublic((tx) =>
    tx
      .select({
        storeId: storeSlugs.storeId,
        currentSlug: stores.slug,
        name: stores.name,
        retiredAt: storeSlugs.retiredAt,
      })
      .from(storeSlugs)
      .innerJoin(stores, eq(stores.id, storeSlugs.storeId))
      .where(eq(storeSlugs.slug, slug)),
  );
  if (!row) notFound();

  cacheTag(storeTag(row.storeId));
  return {
    storeId: row.storeId,
    currentSlug: row.currentSlug,
    name: row.name,
    retired: row.retiredAt !== null,
  };
}
