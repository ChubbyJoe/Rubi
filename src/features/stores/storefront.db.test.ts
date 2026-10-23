import { and, eq, isNull } from "drizzle-orm";
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db, withStore } from "@/lib/db";
import { stores, storeSlugs } from "@/lib/db/schema";
import { connectOwner, eraseSellers, insertSellers, newRun, newStore, publish } from "@/test/db";
import { PLACEHOLDER_SLUG, resolveStoreSlug } from "./storefront";

const cacheTag = vi.fn();
vi.mock("next/cache", () => ({
  cacheLife: () => undefined,
  cacheTag: (...tags: string[]) => cacheTag(...tags),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const run = newRun();
let owner: Client;
let userIds: string[];
let live: { storeId: string; slug: string };
let hidden: { storeId: string; slug: string };
const renamed = `front-live-new-${run}`;

beforeAll(async () => {
  owner = await connectOwner();
  userIds = await insertSellers(owner, run, ["live", "hidden"]);
  live = await newStore(userIds[0], `front-live-${run}`);
  hidden = await newStore(userIds[1], `front-hidden-${run}`);
  await publish(live.storeId);
});

afterAll(async () => {
  await eraseSellers(owner, userIds);
  await owner.end();
  await db.$client.end();
});

beforeEach(() => cacheTag.mockReset());

describe("resolveStoreSlug", () => {
  // covers: AC-3, AC-5
  it("resolves a published store's current slug", async () => {
    expect(await resolveStoreSlug(live.slug)).toEqual({
      storeId: live.storeId,
      currentSlug: live.slug,
      retired: false,
    });
  });

  it("tags the cache entry with the slug and the store", async () => {
    await resolveStoreSlug(live.slug);
    expect(cacheTag.mock.calls.flat()).toEqual([
      `store-slug:${live.slug}`,
      `store:${live.storeId}`,
    ]);
  });

  // covers: AC-3
  it("is not found for an unpublished store", async () => {
    await expect(resolveStoreSlug(hidden.slug)).rejects.toThrow("NEXT_NOT_FOUND");
  });

  // covers: AC-3
  it("is not found for an unknown slug", async () => {
    await expect(resolveStoreSlug(`nope-${run}`)).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("is not found for the static params placeholder, tagged by slug only", async () => {
    await expect(resolveStoreSlug(PLACEHOLDER_SLUG)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(cacheTag.mock.calls.flat()).toEqual([`store-slug:${PLACEHOLDER_SLUG}`]);
  });

  // covers: AC-5
  it("resolves a retired slug to the current one, flagged for a redirect", async () => {
    await withStore(live.storeId, async (tx) => {
      await tx
        .update(storeSlugs)
        .set({ retiredAt: new Date() })
        .where(and(eq(storeSlugs.slug, live.slug), isNull(storeSlugs.retiredAt)));
      await tx.insert(storeSlugs).values({ slug: renamed, storeId: live.storeId });
      await tx.update(stores).set({ slug: renamed }).where(eq(stores.id, live.storeId));
    });
    expect(await resolveStoreSlug(live.slug)).toEqual({
      storeId: live.storeId,
      currentSlug: renamed,
      retired: true,
    });
    expect(await resolveStoreSlug(renamed)).toMatchObject({ retired: false });
  });

  // covers: AC-3
  it("is not found for any slug once the store is unpublished", async () => {
    await publish(live.storeId, null);
    await expect(resolveStoreSlug(renamed)).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(resolveStoreSlug(live.slug)).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
